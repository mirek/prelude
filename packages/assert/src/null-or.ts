import { AssertionError, type Assert } from './prelude.js'

/** Asserts `value` is `null` or satisfies `a`. */
const nullOr =
  <T>(a: Assert<T>): Assert<null | T> =>
    value => {
      if (value === null) {
        return null
      }
      try {
        return a(value)
      } catch (err) {
        if (err instanceof AssertionError && !err.cause) {
          throw new AssertionError({
            expected: `${err.expected} or null`,
            received: value
          })
        }
        throw err
      }
    }

export default nullOr
