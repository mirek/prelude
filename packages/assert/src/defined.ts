import { AssertionError } from './prelude.js'

/** Asserts `value` is not `undefined`. */
const defined =
  <T>(value: T): Exclude<T, undefined> => {
    if (value === undefined) {
      throw new AssertionError({ expected: 'defined', value })
    }
    return value as Exclude<T, undefined>
  }

export default defined
