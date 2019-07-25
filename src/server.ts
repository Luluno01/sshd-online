/* HTTP */
import { createServer } from 'http'
/* Session */
import * as session from 'koa-session'
/* Body parser */
import * as bodyParser from 'koa-bodyparser'
/* Socket.io */
import * as sio from 'socket.io'
/* Koa */
import * as Koa from 'koa'
import * as Router from "koa-router"
/* Config */
// import * as config from '../config.json'
// import * as loggerConfig from '../log4js.json'
let config: any
try {
  config = require('../config.json')
} catch(err) {
  config = require('../../config.json')
}
let loggerConfig: any
try {
  loggerConfig = require('../log4js.json')
} catch(err) {
  loggerConfig = require('../../log4js.json')
}
/* Standard node lib */
import * as path from 'path'
import * as fs from 'fs'
/* Helpers */
import { formatError } from './helpers/formatError'
/* Logger */
import * as _log4js from 'koa-log4'
import { Logger, Log4js } from 'log4js'
const log4js: Log4js & {
  koaLogger(logger: Logger, options: string | Function | object): Koa.Middleware
} = _log4js
/* Middlewares */
import installMiddlewares from './middlewares'
/* Controllers */
import installControllers from './controllers'
/* IOControllers */
import installIOController from './io/controllers'
/* IOMiddlewares */
import installIOMiddleware from './io/middlewares'
import { HttpError } from 'http-errors'


/* Initialize logger */
const appDir = path.resolve(__dirname, '../..')
const logDir = path.join(appDir, 'logs')
try {
  fs.mkdirSync(logDir)
} catch(err) {
  if(err.code != 'EEXIST') {
    console.error(`Could not set up log directory: ${formatError(err)}`)
    process.exit(1)
  }
}
log4js.configure(loggerConfig)
const logger = log4js.getLogger('app')

/* Get port */
let port: number = parseInt(process.env.PORT) || config.port

/* Initialize application */
const app = new Koa
const router = new Router
app.context.config = config
app.use(bodyParser())
app.keys = [ '$4Ocqr8bbb%zi{2E&n]m,d<aV.X7pBLH' ]
app.use(session({
  // store: new MemoryStore
}, app))
router.use(log4js.koaLogger(log4js.getLogger('http'), { level: 'auto' }))

/* Add logger */
app.context.logger = logger

/* Load middlewares */
installMiddlewares(app, router)

/* Install controllers */
installControllers(router)

app.use(router.routes())


/* Create servers */
const server = createServer(app.callback())
const io = sio(server)

/* Install socket.io middlewares */
installIOMiddleware(app, io, log4js.getLogger('io'))

/* Install socket.io controllers */
installIOController(io, log4js.getLogger('io'))

/* Start server */
server.listen(port, () => {
  logger.info(`Server running on port ${port}`)
})

app.on('error', err => {
  if(!(err instanceof HttpError)) logger.error(`Server error: ${formatError(err)}`)
  else if((err.status || err.statusCode).toString().startsWith('5')) logger.error(`Server error: ${formatError(err)}`)
})
