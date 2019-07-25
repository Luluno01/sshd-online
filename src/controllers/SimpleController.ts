import { Method } from '../global'
import { Context } from 'koa'


export class SimpleController {
  method: Method
  pattern: string = '/'
  async handler(ctx: Context, next: () => Promise<any>): Promise<any> { throw new Error('Not implemented') }
}

export default SimpleController
