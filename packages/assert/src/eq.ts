import { inspect } from 'util'
import { AssertionError, type Assert } from './prelude.js'

/** Asserts `value` strictly equals (`===`) `a`. */
const eq =
  <T>(a: T): Assert<T> => {
    const expected = inspect(a)
    return value => {
      if (value === a) {
        return value as T
      }
      throw new AssertionError({ expected, received: value })
    }
  }

export default eq
