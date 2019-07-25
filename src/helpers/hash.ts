import { createHash, BinaryLike } from 'crypto'


/**
 * @description Hash content to hex string.
 * @param content Content to be hashed.
 * @param algo Optional. Hash algorithm. Defaults to `sha512`.
 */
export function hash(content: BinaryLike, algo: string = 'sha512'): string {
  return createHash(algo).update(content).digest('hex')
}

export default hash
