import { AssertionError, type Assert } from './prelude.js'

/** Asserts `value` is a safe integer. */
const safeInteger: Assert<number> =
  value => {
    if (typeof value === 'number' && Number.isSafeInteger(value)) {
      return value
    }
    throw new AssertionError({ expected: 'a safe integer', received: value })
  }

export default safeInteger
