import { RouterController, Path } from './RouterController'
import MUser from '../models/User'
import { Context } from 'koa'


export default class User extends RouterController {
  public pattern: string = '/users'

  @Path('/salt')
  public async salt(ctx: Context) {
    ctx.assert(!ctx.session.loggedIn, 409, 'Already logged in')
    const { username } = ctx.query
    if(typeof username == 'string') {
      ctx.assert(username.match(/^[\d_\w]+$/), 400, 'Invalid user name')
      const user = await MUser.findOne({
        attributes: [ 'id', 'name', 'salt' ],
        where: {
          name: username
        }
      }) as MUser
      if(user) {
        ctx.session.uid = user.id
        ctx.body = user.salt
      } else {
        ctx.body = MUser.generateSalt()  // Return false salt
      }
    } else {
      const dynamicSalt = MUser.generateSalt()
      if(ctx.session.uid) {
        ctx.session.salt = dynamicSalt
      }
      ctx.body = dynamicSalt
    }
  }

  @Path('/login', 'post')
  public async login(ctx: Context) {
    ctx.assert(!ctx.session.loggedIn, 409, 'Already logged in')
    const { uid, salt } = ctx.session
    ctx.assert(uid, 400, 'Unknown user')
    const { password } = ctx.request.body
    ctx.assert(typeof password == 'string' && password.length == 128, 400)
    const user: MUser = await MUser.findByPk(uid as number)
    if(user.auth(salt, password)) {
      ctx.session.loggedIn = true
      delete ctx.session.salt
      ctx.body = ''
    } else {
      ctx.throw(403, 'Incorrect user name or password')
    }
  }

  @Path('/logout')
  public async logout(ctx: Context) {
    ctx.assert(ctx.session.loggedIn, 403, 'Not logged in')
    delete ctx.session.loggedIn
    delete ctx.session.uid
    delete ctx.session.salt
    ctx.body = ''
  }

  @Path('/status')
  public async status(ctx: Context) {
    ctx.body = !!ctx.session.loggedIn
  }
}
