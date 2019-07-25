import * as Koa from 'koa'
import { IOMiddlewareModule } from '../../global'
import * as httpSession from './httpSession'
import * as requireLogin from './requireLogin'
import * as ioSession from './ioSession'
import { Logger } from 'log4js'
import OnionMiddlewareContainer from '../OnionMiddlewareContainer'


export const ioMiddlewareModules: IOMiddlewareModule[] = [
  httpSession,
  requireLogin,
  ioSession
]

export default function installIOMiddlewares(app: Koa, sio: SocketIO.Server, logger: Logger) {
  for(const mod of ioMiddlewareModules) {
    const nsp: SocketIO.Namespace = sio.of(mod.namespace || '/')
    if('init' in mod) mod.init(app, sio, logger)
    if('default' in mod) OnionMiddlewareContainer.for(nsp).use(mod.default)
  }
}
