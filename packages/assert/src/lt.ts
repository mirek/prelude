import { AssertionError, type Assert } from './prelude.js'

/** Asserts `value` is a number less than `than`. */
const lt =
  (than: number): Assert<number> => {
    const expected = `a number less than ${than}`
    return value => {
      if (typeof value === 'number' && value < than) {
        return value
      }
      throw new AssertionError({ expected, received: value })
    }
  }

export default lt
