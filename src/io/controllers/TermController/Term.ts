import * as os from 'os'
import * as assert from 'assert'
import { spawn, IPty, IDisposable } from 'node-pty'
import { SocketEvent } from '../../../helpers/SocketEvent'
import { Socket } from 'socket.io'
import * as log4js from 'log4js'


interface PtyMeta {
  pty: IPty
  dead: boolean
  channel: SocketShellChannel | null
  t: NodeJS.Timeout | null
}

const logger = log4js.getLogger('io')

function getUserHome() {
  return process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME']
}

function getShell() {
  switch (os.platform()) {
    case 'win32': return process.env.ComSpec || 'cmd.exe'
    case 'android': return '/bin/sh'
    default: return '/bin/bash'
  }
}

function createProcess({ cols, rows }: { cols?: number, rows?: number } = { cols: 80, rows: 30 }) {
  const shell = getShell()
  return spawn(shell, [], {
    name: 'xterm-color',
    cols: cols || 80,
    rows: rows || 30,
    cwd: getUserHome(),
    env: process.env as { [key: string]: string },
    experimentalUseConpty: true
  })
}

export class SocketShellChannel {
  public spm: ShellProcessManager
  public meta: PtyMeta
  public socket: Socket
  constructor(spm: ShellProcessManager, meta: PtyMeta, socket: Socket) {
    this.spm = spm
    this.meta = meta
    this.socket = socket
    SocketShellChannelManager.instance.set(socket, this)  // Register this channel
    const { pty } = meta
    const ioSession = socket.ioSession
    const onExitListenerDisposable = pty.onExit(exitInfo => {
      meta.dead = true
      if (socket.connected) {
        logger.info(`[shell] Process ${pty.pid} exited, notifying user`)
        socket.emit('exit', exitInfo)
        // socket.disconnect()  Reserve the connection
        // This channel is no longer valid
        SocketShellChannelManager.instance.delete(socket, pty)
        meta.channel = null
        ioSession.status = SocketStatus.CREATABLE
      } else {
        logger.info(`[shell] Process ${pty.pid} exited`)
      }
    })
    // Pipe stdin, stdout and stderr
    const onDataListenerDisposable = pty.onData(data => socket.send({ data }))
    socket.on('message', data => pty.write(data.toString()))
      .on('resize', ({ cols, rows }: { cols: number, rows: number }) => {
        logger.debug(`[shell] Resizing process ${pty.pid} to ${cols} columns * ${rows} rows`)
        pty.resize(cols, rows)
      })
      .on('disconnect', (/* reason: string */) => {
        // We have no idea if the user will reconnect, so do not kill the
        // process now
        // This channel is no longer valid
        SocketShellChannelManager.instance.delete(socket, pty)
        meta.channel = null
        if (meta.dead) {
          ioSession.status = SocketStatus.CREATABLE
        } else {
          // The process is still alive and can wait for reconnection
          logger.info(`[shell] User disconnected from process ${pty.pid}, waiting for reconnection in 2 min`)
          // No event listener leak
          onExitListenerDisposable.dispose()
          onDataListenerDisposable.dispose()
          spm.unbindSocket(pty.pid)
          ioSession.status = SocketStatus.CREATED
        }
        logger.debug(`[shell] [${socket.id}] Status: ${ioSession.status}`)
      })
      .on('kill', () => {
        this.destroy()
      })
  }

  /**
   * Destroy this channel and the process (invoked by remote user)
   */
  public destroy() {
    const { pty, dead } = this.meta
    if (dead) {
      this.socket.disconnect()  // 'exit' event must have been emitted
      return
    }
    // Process is running, however, the user wants to terminate it
    if (os.platform() == 'win32') {
      pty.kill()
    } else {
      pty.kill('SIGKILL')  // 'exit' event will be emitted afterwards
    }
  }
}

export class SocketShellChannelManager {
  public static instance: SocketShellChannelManager = new SocketShellChannelManager
  public channels: Map<string, SocketShellChannel> = new Map

  constructor() {
    if (!SocketShellChannelManager.instance) {
      SocketShellChannelManager.instance = this
    }
    return SocketShellChannelManager.instance
  }

  public set({ id }: Socket, channel: SocketShellChannel) {
    this.channels.set(id, channel)
    logger.info(`[shell] New channel: ${id} <=> ${channel.meta.pty.pid}`)
    return this
  }

  public get({ id }: Socket) {
    return this.channels.get(id)
  }

  public delete({ id }: Socket, { pid }: IPty = {} as IPty) {
    logger.info(`[shell] Removing channel: ${id} <=> ${pid || '?'}`)
    return this.channels.delete(id)
  }
}

export class CannotCreateShellProcessError extends Error {}
export class SocketAlreadyBoundError extends Error {}

export class ShellProcessManager {
  public static instances: Map<number, ShellProcessManager> = new Map  // Multi-user support

  public uid: number
  /**
   * Pty processes
   * PID => PtyMeta
   */
  public processes: Map<number, PtyMeta> = new Map
  constructor(uid: number) {
    assert(typeof uid == 'number', `Invalid UID: ${uid}`)
    if (ShellProcessManager.instances.has(uid)) {
      return ShellProcessManager.instances.get(uid)
    } else {
      this.uid = uid
      ShellProcessManager.instances.set(uid, this)
    }
  }

  public static for(uid: number) {
    return new ShellProcessManager(uid)
  }

  public async delete(pid: number) {
    const res = this.processes.delete(pid)
    if(this.processes.size == 0) {
      ShellProcessManager.instances.delete(this.uid)
    }
    return res
  }

  public async create(size?: { cols?: number, rows?: number }) {
    const pty = createProcess(size)
    await null
    const { pid } = pty
    if (!pid) {
      throw new CannotCreateShellProcessError('Falsy `pid`')
    }
    const meta: PtyMeta = {
      pty,
      dead: false,
      channel: null,
      t: null
    }
    const onExitListenerDisposable = pty.onExit(_ => {
      if (meta.t) {
        clearTimeout(meta.t)
        meta.t = null
      }
      meta.dead = true
      onExitListenerDisposable.dispose()
      try {
        if (os.platform() == 'win32') {
          pty.kill()
        } else {
          pty.kill('SIGKILL')
        }
      } catch (err) /* tslint:disable:no-empty */ {}
      logger.debug(`[shell] Removing process ${pid} from manager`)
      this.delete(pid)
    })
    await null
    if (meta.dead) {
      throw new CannotCreateShellProcessError('Process is, somehow, magically, already dead')
    }
    this.processes.set(pid, meta)
    meta.t = setTimeout(() => {
      if (os.platform() == 'win32') {
        pty.kill()  // `exit` event should be emitted
      } else {
        pty.kill('SIGKILL')  // `exit` event should be emitted
      }
      meta.t = null
      logger.info(`[shell] Process (${pid}) timeout`)
    }, 120 * 1000)
    return pid
  }

  public bindSocket(pid: number, socket: Socket) {
    const meta = this.processes.get(pid)
    assert(meta, `Process ${pid} does not exist or has been destroyed`)
    if (meta!.t) {
      clearTimeout(meta!.t)
      meta!.t = null
    }
    if (meta!.channel) {
      throw new SocketAlreadyBoundError
    }
    meta!.channel = new SocketShellChannel(this, meta!, socket)
  }

  public unbindSocket(pid: number): boolean {
    const meta = this.processes.get(pid)
    if (!meta || meta.t) {
      logger.warn('[shell] Insane unbind')
      return false
    }
    if (!meta.dead) {
      meta.t = setTimeout(() => {
        if (os.platform() == 'win32') {
          meta.pty.kill()  // `exit` event should be emitted
        } else {
          meta.pty.kill('SIGKILL')  // `exit` event should be emitted
        }
        meta.t = null
        logger.info(`[shell] Process (${pid}) timeout`)
      }, 120 * 1000)
    }
    return true
  }
}

export enum SocketStatus {
  CREATABLE = 'creatable',
  CREATING = 'creating',
  CREATED = 'created',
  BOUND = 'bound'
}

export class Term extends SocketEvent.Listener {
  public socket: Socket
  public shell: IPty
  public spm: ShellProcessManager

  constructor(socket: Socket) {
    super(socket)
    this.socket = socket
    this.spm = ShellProcessManager.for(socket.session.uid)
  }

  @SocketEvent.Event('create')
  public async create(size: { cols?: number, rows?: number }) {
    const { spm, socket, socket: { id, ioSession, ioSession: { status } } } = this
    // One cannot create multiple times in a single connection
    assert(status == undefined || status == SocketStatus.CREATABLE, `Creating shell process for multiple times in a single connection is not allowed (status: ${status})`)
    ioSession.status = SocketStatus.CREATING
    try {
      const pid = await spm.create(size)
      this.shell = spm.processes.get(pid)!.pty
      ioSession.status = SocketStatus.CREATED
      socket.emit('pid', pid)
      this.bindSocket(pid)
    } catch (err) {
      ioSession.status = SocketStatus.CREATABLE
      throw err
    } finally {
      logger.debug(`[shell] [${id}] Status: ${ioSession.status}`)
    }
  }

  @SocketEvent.Event('bind')
  public bindSocket(pid?: number) {
    const { spm, socket, socket: { id, ioSession, ioSession: { status } } } = this
    assert(status == SocketStatus.CREATED, 'Cannot bind socket without creating a shell process first')
    spm.bindSocket(pid || this.shell.pid, socket)
    ioSession.status = SocketStatus.BOUND
    logger.debug(`[shell] [${id}] Status: ${ioSession.status}`)
  }

  public created() {
    return SocketShellChannelManager.instance.channels.has(this.socket.id)
  }

  public notCreated() {
    return !SocketShellChannelManager.instance.channels.has(this.socket.id)
  }

  @SocketEvent.Event('status')
  public getStatus() {
    const { socket, socket: { ioSession: { status } } } = this
    socket.emit('status', status)
  }

  @SocketEvent.Event('pid')
  public getPid() {
    const channel = SocketShellChannelManager.instance.get(this.socket)
    if (channel) {
      this.socket.emit('pid', channel.meta.pty.pid)
    }
  }
}

export default Term
