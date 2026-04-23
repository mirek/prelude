import { AssertionError, type Assert } from './prelude.js'

/** Asserts `value` is `undefined` or satisfies `a`. */
const undefinedOr =
  <T>(a: Assert<T>): Assert<undefined | T> =>
    value => {
      if (value === undefined) {
        return undefined
      }
      try {
        return a(value)
      } catch (err) {
        if (err instanceof AssertionError && !err.cause) {
          throw new AssertionError({
            expected: `${err.expected} or undefined`,
            received: value
          })
        }
        throw err
      }
    }

export default undefinedOr
