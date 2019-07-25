import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as cors from './cors'
import * as responseTime from './responseTime'
import { MiddlewareModule } from '../global'


export const middlewareModules: MiddlewareModule[] = [
  cors,
  responseTime
]

export default function installMiddlewares(app: Koa, router: Router) {
  for(const mod of middlewareModules) {
    if('init' in mod) mod.init(app, router)
    if('default' in mod) router.use(mod.default as any)
  }
}
