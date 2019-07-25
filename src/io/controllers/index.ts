import IOController from './IOController'
import { TermController } from './TermController'
import { Logger } from 'log4js'
import OnionMiddlewareContainer from '../OnionMiddlewareContainer';


const _ioControllers: (typeof IOController)[] = [
  TermController
]

export const ioController: IOController[] = []

export function installIOControllers(io: SocketIO.Server, logger: Logger) {
  for(const Controller of _ioControllers) ioController.push((new Controller(OnionMiddlewareContainer.for(io.of(Controller.namespace)))).setLogger(logger))
}

export default installIOControllers
