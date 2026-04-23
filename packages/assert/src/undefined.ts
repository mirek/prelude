import { AssertionError, type Assert } from './prelude.js'

/** Asserts `value` is `undefined`. */
const undefined_: Assert<undefined> =
  value => {
    if (value === undefined) {
      return value
    }
    throw new AssertionError({ expected: 'undefined', received: value })
  }

export default undefined_
