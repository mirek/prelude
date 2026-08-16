import { ok, fail, type Validator, type Outcome } from './prelude.js'

const typed =
  <T>(name: 'string' | 'number' | 'boolean' | 'bigint' | 'symbol' | 'undefined', test: (value: unknown) => value is T): Validator<T> =>
    value =>
      test(value) ?
        ok(value) :
        fail(value, { kind: 'type', name })

export const string: Validator<string> = typed('string', (value): value is string => typeof value === 'string')
export const number: Validator<number> = typed('number', (value): value is number => typeof value === 'number')
export const boolean: Validator<boolean> = typed('boolean', (value): value is boolean => typeof value === 'boolean')
export const bigint: Validator<bigint> = typed('bigint', (value): value is bigint => typeof value === 'bigint')
export const symbol: Validator<symbol> = typed('symbol', (value): value is symbol => typeof value === 'symbol')
export const undefined_: Validator<undefined> = typed('undefined', (value): value is undefined => value === undefined)

export const null_: Validator<null> =
  value =>
    value === null ?
      ok(value) :
      fail(value, { kind: 'type', name: 'null' })

export const true_: Validator<true> =
  value =>
    value === true ?
      ok(value) :
      fail(value, { kind: 'literal', value: true })

export const false_: Validator<false> =
  value =>
    value === false ?
      ok(value) :
      fail(value, { kind: 'literal', value: false })

export const unknown: Validator<unknown> =
  value =>
    ok(value)

/** Accepts anything but `undefined`; keeps the input type. */
export const defined =
  <T>(value: T): Outcome<Exclude<T, undefined>> =>
    value === undefined ?
      fail(value, { kind: 'defined' }) :
      ok(value as Exclude<T, undefined>)

export const nullish: Validator<undefined | null> =
  value =>
    value == null ?
      ok(value as undefined | null) :
      fail(value, { kind: 'nullish' })

export const finite: Validator<number> =
  value =>
    typeof value === 'number' && Number.isFinite(value) ?
      ok(value) :
      fail(value, { kind: 'finite' })

export const safeInteger: Validator<number> =
  value =>
    typeof value === 'number' && Number.isSafeInteger(value) ?
      ok(value) :
      fail(value, { kind: 'safeInteger' })

export const positive: Validator<number> =
  value =>
    typeof value === 'number' && value > 0 ?
      ok(value) :
      fail(value, { kind: 'positive' })

export const nonBlankString: Validator<string> =
  value =>
    typeof value === 'string' && value.trim() !== '' ?
      ok(value) :
      fail(value, { kind: 'nonBlank' })
