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
      if (!(i in a) || !(i in b)) {
        if (a[i] === undefined && b[i] === undefined) {
          continue
        }
        return false
      }
      if (!eq(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}

export { array_ as array }
