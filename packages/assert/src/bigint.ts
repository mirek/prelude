import { AssertionError, type Assert } from './prelude.js'

/** Asserts `value` is a `bigint`. */
const bigint_: Assert<bigint> =
  value => {
    if (typeof value === 'bigint') {
      return value
    }
    throw new AssertionError({ expected: 'a bigint', received: value })
  }

export default bigint_
