import type { Assert, Primitive, Lifted } from './prelude.js'
import eq from './eq.js'
import null_ from './null.js'
import regexp from './regexp.js'

/**
 * Lifts a primitive value or assert function to an assert function.
 * Primitives become equality checks, `RegExp` becomes a pattern match,
 * functions pass through unchanged.
 */
const lift =
  <T extends Primitive | Assert<unknown>>(a: T): Assert<Lifted<T>> => {
    switch (typeof a) {
      case 'function':
        return a as Assert<Lifted<T>>
      case 'string':
      case 'number':
      case 'boolean':
      case 'undefined':
      case 'bigint':
      case 'symbol':
        return eq(a) as Assert<Lifted<T>>
      case 'object': {
        if (a === null) {
          return null_ as Assert<Lifted<T>>
        }
        if (a instanceof RegExp) {
          return regexp(a) as Assert<Lifted<T>>
        }
        throw new TypeError(`Can't lift ${String(a)}.`)
      }
      default:
        throw new TypeError(`Can't lift ${String(a)}.`)
    }
  }

export default lift
