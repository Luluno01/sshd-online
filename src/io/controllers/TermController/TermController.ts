import * as assert from 'assert'
import IOController from '../IOController'
import Term from './Term'


export class TermController extends IOController {
  public static namespace = '/term'

  protected async onConnect(socket: SocketIO.Socket) {
    assert(socket.session.loggedIn, 'Require login')
    this.logger.debug('[TermController]', socket.id, socket.ioSession)
    new Term(socket)
  }
}
