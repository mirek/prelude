import type { Eq } from './prelude.js'

/**
 * Compares arrays index by index with the provided element equality.
 * A hole opposite a present element is equal only if that element is
 * `undefined` (mirroring how a hole reads as `undefined`); the element
 * equality is never invoked with a hole's `undefined`.
 */
function array_<T>(eq: Eq<T>) {
  return function (a: T[], b: T[]) {
    if (a.length !== b.length) {
      return false
    }
    // Index loop rather than `every`, which skips holes and so treated [, 1] as equal to [2, 1].
    for (let i = 0; i < a.length; i++) {
      // Own slots only: an inherited numeric property (e.g. on Array.prototype or a subclass)
      // must not make a hole look present.
      const inA = Object.hasOwn(a, i)
      const inB = Object.hasOwn(b, i)
      if (!inA || !inB) {
        if ((inA && a[i] !== undefined) || (inB && b[i] !== undefined)) {
          return false
        }
        continue
      }
      if (!eq(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}

export { array_ as array }
