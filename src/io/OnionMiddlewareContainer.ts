import { formatError } from '../helpers/formatError'
import { getLogger } from 'log4js'


type OnionMiddleware = (socket: SocketIO.Socket, next: () => Promise<any>) => Promise<any>

const logger = getLogger('io')

export class OnionMiddlewareContainer {
  public static instances: Map<SocketIO.Namespace, OnionMiddlewareContainer> = new Map
  public nsp: SocketIO.Namespace
  public middlewares: OnionMiddleware[] = []

  constructor(nsp: SocketIO.Namespace) {
    if(OnionMiddlewareContainer.instances.has(nsp)) {
      return OnionMiddlewareContainer.instances.get(nsp)
    } else {
      OnionMiddlewareContainer.instances.set(nsp, this)
      this.nsp = nsp
      nsp.on('connect', socket => this.onConnect(socket))
    }
  }

  public static for(nsp: SocketIO.Namespace) {
    return new OnionMiddlewareContainer(nsp)
  }

  public use(middleware: OnionMiddleware) {
    this.middlewares.push(middleware)
  }

  public onConnect(socket: SocketIO.Socket) {
    if(this.middlewares.length) {
      this.middlewares[0](socket, this.createNext(socket, 1))
        .catch(err => {
          logger.error(`[${socket.id}]`, 'Emitting `err` event', err)
          socket.emit('err', formatError(err))
        })
    }
  }

  private createNext(socket: SocketIO.Socket, nextIndex: number) {
    if(nextIndex >= this.middlewares.length) {
      return async function next() {}
    }
    const nextMiddleware = this.middlewares[nextIndex]
    const mNext = this.createNext(socket, nextIndex + 1)
    return async function next() {
      await nextMiddleware(socket, mNext)
    }
  }
}

export default OnionMiddlewareContainer
