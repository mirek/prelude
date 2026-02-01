import { ok, fail, refail, failed, type Primitive, type Refute, type Result, type Lifted } from './prelude.js'
import lift from './lift.js'

/**
 * Refute combinator over an inexact object.
 *
 * @see partial
 * @see exact
 * @see exactPartial
 */
const object_ =
  <T extends Record<string, Primitive | Refute<unknown>>>(kvs: T) =>
    (value: unknown): Result<{ [k in keyof T]: Lifted<T[k]> }> => {
      if (typeof value !== 'object' || value === null) {
        return fail(value, 'expected object')
      }
      for (const k in kvs) {
        const v = value[k as keyof typeof value]
        const r = lift(kvs[k])(v)
        if (failed(r)) {
          return refail(r, `at key ${k}`)
        }
      }
      return ok(value as { [k in keyof T]: Lifted<T[k]> })
    }

 export default object_
