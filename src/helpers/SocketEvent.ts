import { Object as EObject } from 'unlib.js/src'
import { formatError } from './formatError'
import { getLogger } from 'log4js'


const logger = getLogger('io')

export namespace SocketEvent {
  export const symSocketEvent = Symbol('SocketEvent')

  export function Event(event: string) {
    return function decorator(_prototype: typeof Listener.prototype, _methodName: string, propertyDescriptor: TypedPropertyDescriptor<(...args: any[]) => void>) {
      const { value } = propertyDescriptor
      Object.defineProperty(value, symSocketEvent, {
        value: event,
        writable: true,
        enumerable: false,
        configurable: true
      })
    }
  }

  export class Listener {
    private bindEvent(socket: SocketIO.Socket) {
      for(const [, { value: handler } ] of EObject.getPropertyDescriptorsEntries(this)) {
        if(typeof handler == 'function' && (handler as Function).hasOwnProperty(symSocketEvent)) {
          socket.on(handler[symSocketEvent], async (...args: any[]) => {
            try {
              await (handler as Function).apply(this, args)
            } catch(err) {
              logger.error(`[${socket.id}] Emitting \`err\`@${this.constructor.name}.prototype.${(handler as Function).name}`, err)
              socket.emit('err', formatError(err))
            }
          })
        }
      }
    }

    constructor(socket: SocketIO.Socket) {
      this.bindEvent(socket)
    }
  }
}
