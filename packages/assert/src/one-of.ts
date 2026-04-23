import { inspect } from 'util'
import { AssertionError, type Assert, type Primitive } from './prelude.js'

/** Asserts `value` strictly equals one of `values`. */
const oneOf =
  <T extends Primitive>(...values: readonly T[]): Assert<T> => {
    const expected = `one of ${values.map(_ => inspect(_)).join(', ')}`
    return value => {
      for (let i = 0; i < values.length; i++) {
        if (values[i] === value) {
          return value as T
        }
      }
      throw new AssertionError({ expected, received: value })
    }
  }

export default oneOf
