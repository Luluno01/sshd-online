import * as User from './User'
import _sequelize from './db'


export const models = {
  User
}

export default models

const createTables = [
  User
]

export async function sync() {
  for(let model of createTables) {
    await model.default.sync({ force: true })
  }
  for(let modelName in models) {
    try {
      await models[modelName].sync()
      console.log(`Model ${modelName} synchronized`)
    } catch(err) {
      console.error(`Model ${modelName} failed to synchronize: ${err.stack}`)
      throw err
    }
  }
  sequelize.close()
}

export const sequelize = _sequelize
