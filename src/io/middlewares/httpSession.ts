import * as Koa from 'koa'
import { Socket, Server } from 'socket.io'
import { Logger } from 'log4js'


export const namespace = '/term'

let app: Koa
let logger: Logger
export async function init(mApp: Koa, sio: Server, mLogger: Logger) {
  app = mApp
  logger = mLogger
}

export default async function httpSession(socket: Socket, next: () => Promise<any>) {
  socket.session = app.createContext(socket.request, undefined).session  // Readonly session
  logger.debug(`[${socket.id}]`, 'Mounting http session', socket.session.toJSON())
  await next()
}
