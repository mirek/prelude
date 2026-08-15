import { type R, eq, asc, dsc } from './prelude.js'

/** `NaN`, and strings that coerce to `NaN`, compare as neither less nor greater than anything. */
const nanLike =
  (a: number | bigint | string): boolean =>
    typeof a === 'number' ?
      Number.isNaN(a) :
      typeof a === 'string' ?
        Number.isNaN(Number(a)) :
        false

/**
 * Compares numeric values - numbers, bigints and numeric strings.
 * Comparisions between different types follow logic in js ie. `1 < '2' < 3n`,
 * and equal values of different types are equal ie. `1 == '1' == 1n`.
 * Singleton values follow `NaN < -Infinity < finite numbers < Infinity` ordering;
 * non-numeric strings sort with NaN.
 * NaN is considered equal to itself.
 * -0 is considered equal to 0.
 *
 * @see kind
 */
export const numeric =
  (a: number | bigint | string, b: number | bigint | string): R => {
    if (a < b) {
      return asc
    }
    if (a > b) {
      return dsc
    }
    if (a === b) {
      return eq
    }
    if (Object.is(a, b)) {
      return eq
    }
    // Different types holding the same numeric value, e.g. 1 and '1', 1n and '1', 1n and 1.
    // eslint-disable-next-line eqeqeq
    if (typeof a !== typeof b && a == b) {
      return eq
    }
    const na = nanLike(a)
    const nb = nanLike(b)
    if (na && nb) {
      return eq
    }
    return na ? asc : dsc
  }

export default numeric
