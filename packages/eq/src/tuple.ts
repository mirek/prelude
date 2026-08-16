import type { Eq } from './prelude.js'

/**
 * Compares tuples position by position with the provided element equalities.
 * A hole opposite a present element is equal only if that element is
 * `undefined` (mirroring how a hole reads as `undefined`); an element
 * equality is never invoked with a hole's `undefined`.
 */
export function tuple<T extends unknown[]>(...eqs: Eq<T[number]>[]) {
  return function (a: T, b: T) {
    return eqs.every((eq, i) => {
      // Own slots only, so inherited numeric properties do not make a hole look present.
      const inA = Object.hasOwn(a, i)
      const inB = Object.hasOwn(b, i)
      return inA && inB ?
        eq(a[i], b[i]) :
        !(inA && a[i] !== undefined) && !(inB && b[i] !== undefined)
    })
  }
}
