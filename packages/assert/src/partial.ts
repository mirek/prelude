import { AssertionError, type Assert, type Lifted, type Primitive } from './prelude.js'
import lift from './lift.js'

/**
 * Asserts `value` is an object where each entry from `kvs` is either missing,
 * `undefined`, or satisfies the matching assert.
 */
const partial =
  <T extends Record<string, Primitive | Assert<unknown>>>(kvs: T): Assert<{ [k in keyof T]?: undefined | Lifted<T[k]> }> => {
    const asserts: Record<string, Assert<unknown>> = {}
    for (const k in kvs) {
      asserts[k] = lift(kvs[k])
    }
    return value => {
      if (typeof value !== 'object' || value === null) {
        throw new AssertionError({ expected: 'an object', received: value })
      }
      for (const k in asserts) {
        const v = (value as Record<string, unknown>)[k]
        if (v === undefined) {
          continue
        }
        try {
          asserts[k]!(v)
        } catch (err) {
          if (err instanceof AssertionError) {
            throw new AssertionError({
              expected: err.expected,
              received: err.received,
              key: k,
              cause: err
            })
          }
          throw err
        }
      }
      return value as { [k in keyof T]?: undefined | Lifted<T[k]> }
    }
  }

export default partial
