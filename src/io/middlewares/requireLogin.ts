import * as Koa from 'koa'
import { Socket, Server } from 'socket.io'
import { Logger } from 'log4js'


export const namespace = '/term'

let logger: Logger

export default async function requireLogin(socket: Socket, next: () => Promise<any>) {
  const { session } = socket
  if(session.loggedIn) {
    logger.debug(`[${socket.id}]`, 'Authorized socket')
    await next()
  } else {
    logger.debug(`[${socket.id}]`, 'Unauthorized socket')
    socket.disconnect()
  }
}

export async function init(_app: Koa, sio: Server, ioLogger: Logger) {
  logger = ioLogger
}
