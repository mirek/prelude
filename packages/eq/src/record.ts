import type { Eq } from './prelude.js'

/**
 * Compares records key by key with the provided element equality.
 * A key present on one side only is equal only if its value is `undefined`
 * (mirroring how a missing key reads as `undefined`); the element equality is
 * never invoked with a missing key's `undefined`.
 */
export function record<T>(eq: Eq<T>) {
  return function (a: Record<string, T>, b: Record<string, T>) {
    for (const k in a) {
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
    for (const k in b) {
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
