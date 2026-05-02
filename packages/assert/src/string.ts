import { AssertionError, type Assert } from './prelude.js'

/** Asserts `value` is a `string`. */
const string_: Assert<string> =
  value => {
    if (typeof value === 'string') {
      return value
    }
    throw new AssertionError({ expected: 'a string', value })
  }

export default string_
