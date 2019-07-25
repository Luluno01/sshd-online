import { Random, Constants } from 'unlib.js/src'


export function generateSalt(n: number = 8) {
  return Random.randStr(Constants.VISIBLE_ASCII_CHAR, n)
}

export default generateSalt
