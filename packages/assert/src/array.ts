import { AssertionError, type Assert } from './prelude.js'
import unknown_ from './unknown.js'

/** Asserts `value` is an array where each element satisfies `a`. */
const array_ =
  <T>(a: Assert<T>): Assert<T[]> =>
    value => {
      if (!Array.isArray(value)) {
        throw new AssertionError({ expected: 'an array', received: value })
      }
      if (a === unknown_) {
        return value as T[]
      }
      for (let i = 0; i < value.length; i++) {
        try {
          a(value[i])
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
      return value as T[]
    }

export default array_
