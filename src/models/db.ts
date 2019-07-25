import { Sequelize } from 'sequelize'
let config: any
try {
  config = require('../../sequelize.config.js')
} catch(err) {
  config = require('../../../sequelize.config.js')
}


export const sequelize = new Sequelize(process.env.DB_URL, config)

export default sequelize
