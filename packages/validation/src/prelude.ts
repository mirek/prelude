/** A validator: checks an unknown value and returns it typed, or a structured failure. */
export type Validator<T> =
  (value: unknown) => Outcome<T>

export type Ok<T> = {
  ok: true,
  value: T
}

/**
 * Where a failure was found: `key`/`index` steps into a property or array
 * element, `keyOf` marks a failing property *name* (in `record`), and `or`
 * records that a `nullOr`/`undefinedOr`/`nullishOr` wrapper was passed
 * through — the alternatives it accepts belong to the description.
 */
export type Segment =
  | { kind: 'key', key: string | symbol }
  | { kind: 'index', index: number }
  | { kind: 'keyOf', key: string }
  | { kind: 'or', alternative: 'null' | 'undefined' | 'nullish' }

/** What was expected at the failure site, structurally: each host package renders it in its own words. */
export type Expected =
  | { kind: 'type', name: 'string' | 'number' | 'boolean' | 'bigint' | 'symbol' | 'undefined' | 'null' | 'array' | 'object' }
  | { kind: 'literal', value: unknown }
  | { kind: 'is', value: unknown }
  | { kind: 'defined' }
  | { kind: 'nullish' }
  | { kind: 'finite' }
  | { kind: 'safeInteger' }
  | { kind: 'positive' }
  | { kind: 'compare', operator: 'gt' | 'gte' | 'lt' | 'lte', than: number }
  | { kind: 'between', min: number, max: number }
  | { kind: 'oneOf', values: readonly unknown[] }
  | { kind: 'regexp', regexp: RegExp }
  | { kind: 'instance', constructor: Constructor }
  | { kind: 'maxLength', length: number }
  | { kind: 'extraKeys', keys: string[], partial: boolean }
  | { kind: 'unique' }
  | { kind: 'union', failures: Failure[] } // eslint-disable-line no-use-before-define
  | { kind: 'strftime', format: string, index: number }
  | { kind: 'calendarDate', problem: 'format' | 'invalid' }
  | { kind: 'nonBlank' }
  | { kind: 'predicate' }
  | { kind: 'text', text: string }

export type Failure = {
  ok: false,
  /** From the outermost container down to the failing value. */
  path: Segment[],
  expected: Expected,
  /** The failing value itself (the innermost one, not the container). */
  received: unknown
}

export type Outcome<T> =
  | Ok<T>
  | Failure

/** Type a validator produces. */
export type Validated<V> =
  V extends Validator<infer T> ?
    T :
    never

/** Values `lift` turns into validators. */
export type Primitive =
  | undefined
  | null
  | false
  | true
  | number
  | bigint
  | string
  | symbol
  | RegExp

export type Lifted<T> =
  T extends Validator<infer U> ?
    U :
    T extends Primitive ?
      T :
      never

export type IntersectionOfUnion<T> =
  (T extends unknown ? (_: T) => unknown : never) extends (_: infer R) => unknown ?
    R :
    never

export type Constructor = abstract new (...args: any) => any

export type Key = string | number | symbol

export const ok =
  <T>(value: T): Ok<T> =>
    ({ ok: true, value })

export const fail =
  (received: unknown, expected: Expected, path: Segment[] = []): Failure =>
    ({ ok: false, path, expected, received })

export const failed =
  (outcome: Outcome<unknown>): outcome is Failure =>
    !outcome.ok

/** The failure one level deeper: `segment` is prepended to its path. */
export const nested =
  (failure: Failure, segment: Segment): Failure =>
    ({ ...failure, path: [ segment, ...failure.path ] })

/**
 * Well-known property under which a host package's function (an assert, a
 * predicate, a refute) carries the core validator it wraps, so container
 * combinators can compose validators structurally instead of round-tripping
 * through thrown errors, booleans or reason strings.
 */
export const validatorOf: unique symbol = Symbol.for('@prelude/validation/validator') as never

/** Attaches `validator` to `f` (see {@link validatorOf}) and returns `f`. */
export const wrapped =
  <F>(f: F, validator: Validator<unknown>): F =>
    Object.defineProperty(f, validatorOf, { value: validator })

/** The core validator behind a host function, if it carries one. */
export const unwrap =
  (f: unknown): undefined | Validator<unknown> =>
    typeof f === 'function' ?
      (f as { [validatorOf]?: Validator<unknown> })[validatorOf] :
      undefined
