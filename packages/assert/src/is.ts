import { inspect } from 'util'
import { AssertionError, type Assert } from './prelude.js'

/** Asserts `value` is `Object.is`-equal to `a`. */
const is =
  <T>(a: T): Assert<T> => {
    const expected = inspect(a)
    return value => {
      if (Object.is(value, a)) {
        return value as T
      }
      throw new AssertionError({ expected, received: value })
    }
  }

export default is
