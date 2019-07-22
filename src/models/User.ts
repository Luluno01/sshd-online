import * as Sequelize from 'sequelize'
import sequelize from './db'
import { formatError } from '../helpers/formatError'
import Store from '../helpers/Store'
const { cache } = require('../../config.json')


const User = sequelize.define('lastUpdate', {
  // ...
})

export default User as TUser

type TUser = typeof User & {
  id: number
  // ...
  createdAt: Date
  updatedAt: Date
  toJSON(): object
}

const store = new Store

export async function sync() {
  // await LastUpdate.sync({ force: true })
}
