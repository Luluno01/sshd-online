import { Logger } from 'log4js'
import OnionMiddlewareContainer from '../OnionMiddlewareContainer'


export class IOController {
  public static namespace: string = '/'

  protected logger: Logger

  constructor(container: OnionMiddlewareContainer) {
    container.use(async (socket: SocketIO.Socket, next: () => Promise<any>) => {
      await this.onConnect(socket)
      await next()
    })
  }

  protected async onConnect(socket: SocketIO.Socket) {
    throw new Error('Not implemented')
  }

  public setLogger(logger: Logger) {
    this.logger = logger
    return this
  }
}

export default IOController
