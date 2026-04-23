import { AssertionError, type Assert } from './prelude.js'

/** Asserts `value` is `null`. */
const null_: Assert<null> =
  value => {
    if (value === null) {
      return value
    }
    throw new AssertionError({ expected: 'null', received: value })
  }

export default null_
