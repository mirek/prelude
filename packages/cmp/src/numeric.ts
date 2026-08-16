import { type R, eq, asc, dsc } from './prelude.js'
import bigint from './bigint.js'
import number from './number.js'
import string from './string.js'

/** `NaN`, and strings that coerce to `NaN`, compare as neither less nor greater than anything. */
const nanLike =
  (a: number | bigint | string): boolean =>
    typeof a === 'number' ?
      Number.isNaN(a) :
      typeof a === 'string' ?
        Number.isNaN(Number(a)) :
        false

/** Optionally signed decimal integer literal, as accepted by both `Number` and `BigInt`. */
const integerLiteral =
  /^\s*[+-]?\d+\s*$/

/**
 * Compares two strings in the numeric domain, so that ordering stays transitive with number and
 * bigint operands: numeric strings compare by value (exactly when both are integer literals),
 * non-numeric strings sort first (with `NaN`) and lexicographically among themselves.
 */
const strings =
  (a: string, b: string): R => {
    const na = nanLike(a)
    const nb = nanLike(b)
    if (na || nb) {
      return na && nb ? string(a, b) : na ? asc : dsc
    }
    if (integerLiteral.test(a) && integerLiteral.test(b)) {
      return bigint(BigInt(a), BigInt(b))
    }
    return number(Number(a), Number(b))
  }

/**
 * Compares numeric values - numbers, bigints and numeric strings.
 * Comparisions between different types follow logic in js ie. `1 < '2' < 3n`,
 * and equal values of different types are equal ie. `1 == '1' == 1n`.
 * Two strings that both coerce to a number are compared by numeric value ie. `'2' < '10'`,
 * exactly when both are integer literals; other strings compare lexicographically among themselves.
 * Singleton values follow `NaN < -Infinity < finite numbers < Infinity` ordering;
 * non-numeric strings sort with NaN.
 * NaN is considered equal to itself.
 * -0 is considered equal to 0.
 *
 * @see kind
 */
export const numeric =
  (a: number | bigint | string, b: number | bigint | string): R => {
    if (typeof a === 'string' && typeof b === 'string') {
      return strings(a, b)
    }
    // A bigint and a non-integer numeric string are incomparable in js (`1n < '1.5'` is false both
    // ways); compare the string as a number instead (bigint vs number comparisons are exact).
    if (typeof a === 'bigint' && typeof b === 'string') {
      return numeric(a, Number(b))
    }
    if (typeof a === 'string' && typeof b === 'bigint') {
      return numeric(Number(a), b)
    }
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
