import { AssertionError, type Assert } from './prelude.js'

/** Asserts `value` is a number greater than or equal to `than`. */
const gte =
  (than: number): Assert<number> => {
    const expected = `a number greater than or equal to ${than}`
    return value => {
      if (typeof value === 'number' && value >= than) {
        return value
      }
      throw new AssertionError({ expected, value })
    }
  }

export default gte
