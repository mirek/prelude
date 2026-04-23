import { AssertionError, type Assert } from './prelude.js'

/** Asserts `value` is a number in `[min, max]` (inclusive). */
const between =
  (min: number, max: number): Assert<number> => {
    const expected = `a number between ${min} and ${max}`
    return value => {
      if (typeof value === 'number' && value >= min && value <= max) {
        return value
      }
      throw new AssertionError({ expected, received: value })
    }
  }

export default between
