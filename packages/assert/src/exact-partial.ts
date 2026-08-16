import { AssertionError, type Assert, type Lifted, type Primitive } from './prelude.js'
import lift from './lift.js'

/**
 * Asserts `value` is an exact, partial object — entries from `kvs` may be
 * missing or `undefined`, but no extras are allowed.
 */
const exactPartial =
  <T extends Record<string, Primitive | Assert<unknown>>>(kvs: T): Assert<{ [k in keyof T]?: undefined | Lifted<T[k]> }> => {
    // Null prototype so a declared `__proto__` key becomes an own entry instead of invoking the legacy setter.
    const asserts: Record<string, Assert<unknown>> = Object.create(null)
    for (const k in kvs) {
      asserts[k] = lift(kvs[k])
    }
    return value => {
      if (typeof value !== 'object' || value === null) {
        throw new AssertionError({ expected: 'an object', value })
      }
      for (const k in asserts) {
        // Own lookup: an absent own `__proto__` must read as `undefined`, not as the prototype.
        const v = Object.hasOwn(value, k) ? (value as Record<string, unknown>)[k] : undefined
        if (v === undefined) {
          continue
        }
        try {
          asserts[k]!(v)
        } catch (err) {
          if (err instanceof AssertionError) {
            throw new AssertionError({
              expected: err.expected,
              value: err.value,
              key: k,
              cause: err
            })
          }
          throw err
        }
      }
      for (const k in value) {
        // `in` would accept inherited names such as `constructor` or `toString` as declared keys.
        if (!Object.hasOwn(asserts, k)) {
          throw new AssertionError({
            expected: 'no extra keys',
            value,
            key: k
          })
        }
      }
      return value as { [k in keyof T]?: undefined | Lifted<T[k]> }
    }
  }

export default exactPartial
