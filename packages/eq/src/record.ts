import type { Eq } from './prelude.js'

/**
 * Compares records own key by own key with the provided element equality;
 * inherited enumerable properties are ignored on both sides.
 * A key present on one side only is equal only if its value is `undefined`
 * (mirroring how a missing key reads as `undefined`); the element equality is
 * never invoked with a missing key's `undefined`.
 */
export function record<T>(eq: Eq<T>) {
  return function (a: Record<string, T>, b: Record<string, T>) {
    for (const k of Object.keys(a)) {
      if (!Object.hasOwn(b, k)) {
        if (a[k] === undefined) {
          continue
        }
        return false
      }
      if (!eq(a[k], b[k])) {
        return false
      }
    }
    for (const k of Object.keys(b)) {
      if (Object.hasOwn(a, k)) {
        continue
      }
      if (b[k] !== undefined) {
        return false
      }
    }
    return true
  }
}
