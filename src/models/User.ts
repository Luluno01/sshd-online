import { Model, DataTypes } from 'sequelize'
import sequelize from './db'
import hash from '../helpers/hash'
import generateSalt from '../helpers/generateSalt'


class User extends Model {
  public id!: string
  public name!: string

  /**
   * Static salt
   */
  public salt!: string
  /**
   * Hashed, salted password
   * sha512(staticSalt, plainPassword)
   */
  public password!: string

  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  /**
   * Generate salt
   */
  public static generateSalt() {
    return generateSalt() as string & { length: 8 }
  }

  /**
   *
   * @param dynamicSalt Dynamic salt
   * @param hashedSaltedPassword sha512(dynamicSalt, sha512(staticSalt, plainPassword))
   */
  public auth(dynamicSalt: string, hashedSaltedPassword: string) {
    return hash(dynamicSalt + this.password) == hashedSaltedPassword
  }

  public setNewPassword(newSalt: string, newPassword: string) {
    this.salt = newSalt
    this.password = newPassword
    return this
  }

  public static async internalCreate(name: string, password: string) {
    const salt = User.generateSalt()
    password = hash(salt + password)
    return await User.create({
      name,
      salt,
      password
    }) as User
  }
}
User.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: new DataTypes.STRING(128),
    allowNull: false,
  },
  salt: {
    type: new DataTypes.STRING(8),
    allowNull: true
  },
  password: {
    type: new DataTypes.STRING(128),
    allowNull: true
  }
}, {
  sequelize,
  tableName: 'users'
})

export default User

export async function sync() {
  // await LastUpdate.sync({ force: true })
}
