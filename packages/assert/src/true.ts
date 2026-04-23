import { AssertionError, type Assert } from './prelude.js'

/** Asserts `value` is `true`. */
const true_: Assert<true> =
  value => {
    if (value === true) {
      return true as const
    }
    throw new AssertionError({ expected: 'true', received: value })
  }

export default true_
