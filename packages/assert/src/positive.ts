import { AssertionError, type Assert } from './prelude.js'

/** Asserts `value` is a positive number (> 0). */
const positive: Assert<number> =
  value => {
    if (typeof value === 'number' && value > 0) {
      return value
    }
    throw new AssertionError({ expected: 'a positive number', received: value })
  }

export default positive
