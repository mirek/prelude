import { AssertionError, type Assert, type Asserted } from './prelude.js'

/** Asserts `value` is a tuple whose positions each satisfy the matching assert. */
const tuple =
  <T extends [...Assert<unknown>[]]>(...as: T): Assert<{ [I in keyof T]: Asserted<T[I]> }> =>
    value => {
      if (!Array.isArray(value)) {
        throw new AssertionError({ expected: 'an array', received: value })
      }
      if (value.length > as.length) {
        throw new AssertionError({
          expected: `an array not longer than ${as.length}`,
          received: value
        })
      }
      for (let i = 0; i < value.length; i++) {
        try {
          as[i]!(value[i])
        } catch (err) {
          if (err instanceof AssertionError) {
            throw new AssertionError({
              expected: err.expected,
              received: err.received,
              key: i,
              cause: err
            })
          }
          throw err
        }
      }
      return value as { [I in keyof T]: Asserted<T[I]> }
    }

export default tuple
