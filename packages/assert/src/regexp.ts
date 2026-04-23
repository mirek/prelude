import { AssertionError, type Assert } from './prelude.js'

/** Asserts `value` is a string matching `re`. */
const regexp =
  (re: RegExp): Assert<string> => {
    const expected = `a string matching ${re}`
    return value => {
      if (typeof value !== 'string') {
        throw new AssertionError({ expected: 'a string', received: value })
      }
      if (!re.test(value)) {
        throw new AssertionError({ expected, received: value })
      }
      return value
    }
  }

export default regexp
