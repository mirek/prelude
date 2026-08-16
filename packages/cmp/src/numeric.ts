import { type R, eq, asc, dsc } from './prelude.js'
import string from './string.js'

/**
 * A finite numeric value in one exact decimal domain: `sign * magnitude * 10 ** exponent`.
 * Bigints and decimal strings convert to it losslessly; a number converts through its shortest
 * round-trip decimal (`String(n)`), which is injective and order preserving, so `0.1 == '0.1'`
 * as in js while comparisons between values never round.
 */
type Exact = {
  readonly sign: -1 | 0 | 1,
  readonly magnitude: bigint,
  readonly exponent: number
}

type Parsed =
  | 'nan'
  | '-inf'
  | 'inf'
  | Exact

const zero: Exact = { sign: 0, magnitude: 0n, exponent: 0 }

/** Decimal literal after trimming: optional sign, digits with an optional fraction and exponent. */
const decimalLiteral =
  /^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i

/** Prefixed integer literals `Number` and `BigInt` both accept (unsigned only). */
const prefixedLiteral =
  /^0(?:x[0-9a-f]+|o[0-7]+|b[01]+)$/i

const exact =
  (negative: boolean, magnitude: bigint, exponent: number): Exact =>
    magnitude === 0n ?
      zero :
      { sign: negative ? -1 : 1, magnitude, exponent }

const fromNumber =
  (value: number): Parsed => {
    if (Number.isNaN(value)) {
      return 'nan'
    }
    if (!Number.isFinite(value)) {
      return value < 0 ? '-inf' : 'inf'
    }
    if (Number.isInteger(value)) {
      return exact(value < 0, BigInt(Math.abs(value)), 0)
    }
    return fromString(String(value))
  }

const fromString =
  (value: string): Parsed => {
    const trimmed = value.trim()
    if (trimmed === '') {
      return zero
    }
    const match = decimalLiteral.exec(trimmed)
    if (match && (match[2] || match[3])) {
      const [ , sign, integer, fraction = '', power = '0' ] = match
      return exact(sign === '-', BigInt(integer + fraction), Number(power) - fraction.length)
    }
    if (prefixedLiteral.test(trimmed)) {
      return exact(false, BigInt(trimmed), 0)
    }
    // `Infinity`, `-Infinity` and anything `Number` rejects.
    return fromNumber(Number(trimmed))
  }

const parse =
  (value: number | bigint | string): Parsed =>
    typeof value === 'number' ?
      fromNumber(value) :
      typeof value === 'bigint' ?
        exact(value < 0n, value < 0n ? -value : value, 0) :
        fromString(value)

/** Compares magnitudes by order of magnitude first, aligning exponents only when those tie. */
const magnitudes =
  (a: Exact, b: Exact): R => {
    const orderA = a.exponent + a.magnitude.toString().length
    const orderB = b.exponent + b.magnitude.toString().length
    if (orderA !== orderB) {
      return orderA < orderB ? asc : dsc
    }
    const exponent = Math.min(a.exponent, b.exponent)
    const ma = a.magnitude * 10n ** BigInt(a.exponent - exponent)
    const mb = b.magnitude * 10n ** BigInt(b.exponent - exponent)
    return ma < mb ? asc : ma > mb ? dsc : eq
  }

const rank =
  (value: Parsed): number =>
    value === 'nan' ? 0 : value === '-inf' ? 1 : value === 'inf' ? 3 : 2

/**
 * Compares numeric values - numbers, bigints and numeric strings - by exact numeric value,
 * whatever their type or spelling: `1 == '1' == 1n == '1.0' == '1e0'`, `'2' < '10'`, and
 * integers beyond double precision compare exactly (`'9007199254740993' > 9007199254740992`).
 * Singleton values follow `NaN < -Infinity < finite numbers < Infinity` ordering.
 * Non-numeric strings sort with `NaN`: after it, in lexicographic order among themselves.
 * NaN is considered equal to itself.
 * -0 is considered equal to 0.
 *
 * @see kind
 */
export const numeric =
  (a: number | bigint | string, b: number | bigint | string): R => {
    const pa = parse(a)
    const pb = parse(b)
    const ra = rank(pa)
    const rb = rank(pb)
    if (ra !== rb) {
      return ra < rb ? asc : dsc
    }
    if (typeof pa === 'string' || typeof pb === 'string') {
      // Both NaN-like (or both the same infinity): `NaN` first, then non-numeric strings by text.
      if (pa === 'nan') {
        return typeof a === 'string' ?
          typeof b === 'string' ? string(a, b) : dsc :
          typeof b === 'string' ? asc : eq
      }
      return eq
    }
    if (pa.sign !== pb.sign) {
      return pa.sign < pb.sign ? asc : dsc
    }
    if (pa.sign === 0) {
      return eq
    }
    const order = magnitudes(pa, pb)
    return pa.sign < 0 ? (order === asc ? dsc : order === dsc ? asc : eq) : order
  }

export default numeric
