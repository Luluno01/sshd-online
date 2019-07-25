import { sync as syncModels } from '../models'


export default async function sync() {
  await syncModels()
}

sync()
