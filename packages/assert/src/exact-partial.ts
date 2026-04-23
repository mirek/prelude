import { AssertionError, type Assert, type Lifted, type Primitive } from './prelude.js'
import lift from './lift.js'

/**
 * Asserts `value` is an exact, partial object — entries from `kvs` may be
 * missing or `undefined`, but no extras are allowed.
 */
const exactPartial =
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
      for (const k in value) {
        if (!(k in asserts)) {
          throw new AssertionError({
            expected: 'no extra keys',
            received: value,
            key: k
          })
        }
      }
      return value as { [k in keyof T]?: undefined | Lifted<T[k]> }
    }
  }

export default exactPartial
