import { AssertionError, type Assert } from './prelude.js'

/** Asserts `value` is `false`. */
const false_: Assert<false> =
  value => {
    if (value === false) {
      return false as const
    }
    throw new AssertionError({ expected: 'false', received: value })
  }

export default false_
