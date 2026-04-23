import { AssertionError, type Assert } from './prelude.js'

/** Asserts `value` is `null`, `undefined`, or satisfies `a`. */
const nullishOr =
  <T>(a: Assert<T>): Assert<null | undefined | T> =>
    value => {
      if (value == null) {
        return value as null | undefined
      }
      try {
        return a(value)
      } catch (err) {
        if (err instanceof AssertionError && !err.cause) {
          throw new AssertionError({
            expected: `${err.expected} or nullish`,
            received: value
          })
        }
        throw err
      }
    }

export default nullishOr
