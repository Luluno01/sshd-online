import * as assert from 'assert'
import User from '../models/User'


export default async function createUser(name: string, password: string) {
  assert(name, 'User name is required!')
  assert(password.length > 8, 'Password too short')
  let user = await User.internalCreate(name, password)
  user = await User.findOne({
    where: {
      name
    }
  })
  console.log('User created:', user.id)
}

if(process.argv.length == 4) {
  createUser(process.argv[2], process.argv[3])
} else {
  console.error('Usage:')
  console.error('  npm run createUser -- <username> <password>')
  process.exit(1)
}
