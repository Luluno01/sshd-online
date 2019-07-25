import SimpleController from './controllers/SimpleController'
import RouterController from './controllers/RouterController'
import * as Koa from 'koa'
import { Context } from 'koa'
import { Logger } from 'log4js'
import * as KoaRouter from 'koa-router'
import { Session } from 'koa-session'
import { SocketStatus } from './io/controllers/TermController/Term'


declare type Method = 'get' | 'post' | 'put' | 'del' | 'all'
declare type Controller = SimpleController | RouterController
declare interface Formatable {
  toJSON(): object
}
declare type Router = KoaRouter
declare interface MiddlewareModule {
  init?(app: Koa, router: Router): Promise<void>
  default?(ctx: Context, next: () => Promise<any>): Promise<void>
}
declare interface IOMiddlewareModule {
  namespace?: string
  init?(app: Koa, sio: SocketIO.Server, logger: Logger): Promise<void>
  default?(socket: SocketIO.Socket, next: () => Promise<any>): Promise<void>
}
declare module 'koa' {
  interface Context {
    logger: Logger
  }
}
declare module 'socket.io' {
  interface Socket {
    session: Session
    ioSession: {
      status: SocketStatus
      [key: string]: string
    }
  }
}
