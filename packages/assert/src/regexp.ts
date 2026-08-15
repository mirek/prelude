import { AssertionError, type Assert } from './prelude.js'

/** Asserts `value` is a string matching `re`. */
const regexp =
  (re: RegExp): Assert<string> => {
    const expected = `a string matching ${re}`
    return value => {
      if (typeof value !== 'string') {
        throw new AssertionError({ expected: 'a string', value })
      }
      // A global or sticky regexp keeps lastIndex between calls, making test() alternate results.
      re.lastIndex = 0
      if (!re.test(value)) {
        throw new AssertionError({ expected, value })
      }
      return value
    }
  }

export default regexp
