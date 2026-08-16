import type { Eq } from './prelude.js'

/**
 * Compares tuples position by position with the provided element equalities.
 * A hole opposite a present element is equal only if that element is
 * `undefined` (mirroring how a hole reads as `undefined`); an element
 * equality is never invoked with a hole's `undefined`.
 */
export function tuple<T extends unknown[]>(...eqs: Eq<T[number]>[]) {
  return function (a: T, b: T) {
    return eqs.every((eq, i) =>
      i in a && i in b ?
        eq(a[i], b[i]) :
        a[i] === undefined && b[i] === undefined
    )
  }
}
