import { AssertionError, type Assert } from './prelude.js'

/** Asserts `value` is a finite number. */
const finite: Assert<number> =
  value => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
    throw new AssertionError({ expected: 'a finite number', received: value })
  }

export default finite
