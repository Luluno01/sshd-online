import * as Koa from 'koa'
import { Socket, Server } from 'socket.io'
import { SocketStatus } from '../controllers/TermController/Term'
import { Logger } from 'log4js'


export const namespace = '/term'

let logger: Logger
export default async function ioSession(socket: Socket, next: () => Promise<any>) {
  socket.ioSession = {
    status: SocketStatus.CREATABLE
  }
  logger.debug(`[${socket.id}]`, 'Creating io session', socket.ioSession)
  await next()
}

export async function init(_app: Koa, _sio: Server, mLogger: Logger) {
  logger = mLogger
}
