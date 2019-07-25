import * as Router from 'koa-router'
import { Context } from 'koa'
import { Object as EObject } from 'unlib.js/src'
import { Method } from '../global'


export const symPath = Symbol('Path')

export function Path(path: string, method: Method = 'get') {
  return function decorator(_target: typeof RouterController.prototype, _methodName: string, propertyDescriptor: TypedPropertyDescriptor<(ctx: Context, next: () => Promise<any>) => Promise<void>>) {
    const { value } = propertyDescriptor
    Object.defineProperty(value, symPath, {
      value: { method, path },
      enumerable: false,
      writable: true,
      configurable: true
    })
  }
}

export class RouterController {
  public pattern: string = '/'
  public router: Router = new Router

  private bindPath() {
    const router = this.router
    for(const [ , { value: handler } ] of EObject.getPropertyDescriptorsEntries(this)) {
      if(typeof handler == 'function' && (handler as Function).hasOwnProperty(symPath)) {
        const { method, path } = handler[symPath] as { method: Method, path: string }
        router[method](path, (handler as Function).bind(this))
      }
    }
  }

  constructor() {
    this.bindPath()
  }
}

export default RouterController