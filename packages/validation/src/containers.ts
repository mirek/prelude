import { ok, fail, failed, nested, type Lifted, type Primitive, type Validated, type Validator } from './prelude.js'
import { lift } from './combinators.js'
import { unknown } from './primitives.js'

const isObject =
  (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null

/**
 * Builds the table of property validators. Null prototype so a declared
 * `__proto__` key becomes an own entry instead of invoking the legacy setter.
 */
const table =
  <T extends Record<string, Primitive | Validator<unknown>>>(kvs: T): Record<string, Validator<unknown>> => {
    const validators: Record<string, Validator<unknown>> = Object.create(null)
    for (const k in kvs) {
      validators[k] = lift(kvs[k])
    }
    return validators
  }

/** Own lookup: an absent own `__proto__` must read as `undefined`, not as the prototype. */
const own =
  (value: Record<string, unknown>, k: string): unknown =>
    Object.hasOwn(value, k) ? value[k] : undefined

/**
 * Checks the declared properties (`own` restricts the lookup to own
 * properties, `partial` skips `undefined` ones) and, when `exact`, rejects
 * any own key that was not declared.
 */
const properties =
  <T extends Record<string, Primitive | Validator<unknown>>>(kvs: T, { own: ownOnly, partial, exact }: { own: boolean, partial: boolean, exact: boolean }) => {
    const validators = table(kvs)
    return (value: unknown) => {
      if (!isObject(value)) {
        return fail(value, { kind: 'type', name: 'object' })
      }
      for (const k in validators) {
        const v = ownOnly ? own(value, k) : value[k]
        if (partial && v === undefined) {
          continue
        }
        const outcome = validators[k](v)
        if (failed(outcome)) {
          return nested(outcome, { kind: 'key', key: k })
        }
      }
      if (exact) {
        // `in` would accept inherited names such as `constructor` or `toString` as declared keys.
        const extra = Object.keys(value).filter(k => !Object.hasOwn(validators, k))
        if (extra.length > 0) {
          return fail(value, { kind: 'extraKeys', keys: extra, partial })
        }
      }
      return ok(value)
    }
  }

/** Every declared property must validate; other properties are ignored. */
export const object =
  <T extends Record<string, Primitive | Validator<unknown>>>(kvs: T): Validator<{ [k in keyof T]: Lifted<T[k]> }> =>
    properties(kvs, { own: false, partial: false, exact: false }) as Validator<{ [k in keyof T]: Lifted<T[k]> }>

/** Like `object`, but a declared property that is `undefined` is skipped. */
export const partial =
  <T extends Record<string, Primitive | Validator<unknown>>>(kvs: T): Validator<{ [k in keyof T]?: undefined | Lifted<T[k]> }> =>
    properties(kvs, { own: false, partial: true, exact: false }) as Validator<{ [k in keyof T]?: undefined | Lifted<T[k]> }>

/** Like `object` (own properties only), and no other own key may be present. */
export const exact =
  <T extends Record<string, Primitive | Validator<unknown>>>(kvs: T): Validator<{ [k in keyof T]: Lifted<T[k]> }> =>
    properties(kvs, { own: true, partial: false, exact: true }) as Validator<{ [k in keyof T]: Lifted<T[k]> }>

/** Like `partial` (own properties only), and no other own key may be present. */
export const exactPartial =
  <T extends Record<string, Primitive | Validator<unknown>>>(kvs: T): Validator<{ [k in keyof T]?: undefined | Lifted<T[k]> }> =>
    properties(kvs, { own: true, partial: true, exact: true }) as Validator<{ [k in keyof T]?: undefined | Lifted<T[k]> }>

/** Every element must validate; `unknown` short-circuits. */
export const array =
  <T>(a: Validator<T>): Validator<T[]> =>
    value => {
      if (!Array.isArray(value)) {
        return fail(value, { kind: 'type', name: 'array' })
      }
      if (a === unknown) {
        return ok(value as T[])
      }
      for (let i = 0; i < value.length; i++) {
        const outcome = a(value[i])
        if (failed(outcome)) {
          return nested(outcome, { kind: 'index', index: i })
        }
      }
      return ok(value as T[])
    }

/** Every declared position must validate (a missing trailing element only passes if its validator accepts `undefined`); no extra elements. */
export const tuple =
  <T extends [...Validator<unknown>[]]>(...as: T): Validator<{ [I in keyof T]: Validated<T[I]> }> =>
    value => {
      if (!Array.isArray(value)) {
        return fail(value, { kind: 'type', name: 'array' })
      }
      if (value.length > as.length) {
        return fail(value, { kind: 'maxLength', length: as.length })
      }
      for (let i = 0; i < as.length; i++) {
        const outcome = as[i](value[i])
        if (failed(outcome)) {
          return nested(outcome, { kind: 'index', index: i })
        }
      }
      return ok(value as { [I in keyof T]: Validated<T[I]> })
    }

/** Every enumerable key must validate with `k` (reported as `keyOf`) and every value with `v`. */
export const record =
  <K extends string | symbol | number, V>(k: Validator<K>, v: Validator<V>): Validator<Record<K, V>> =>
    value => {
      if (!isObject(value)) {
        return fail(value, { kind: 'type', name: 'object' })
      }
      for (const key in value) {
        const keyOutcome = k(key)
        if (failed(keyOutcome)) {
          return nested(keyOutcome, { kind: 'keyOf', key })
        }
        const valueOutcome = v(value[key])
        if (failed(valueOutcome)) {
          return nested(valueOutcome, { kind: 'key', key })
        }
      }
      return ok(value as Record<K, V>)
    }

/** Every element must validate and be unique by `f` (default: the validated element itself). */
export const unique =
  <T>(a: Validator<T>, f?: (value: T) => Primitive): Validator<T[]> =>
    value => {
      if (!Array.isArray(value)) {
        return fail(value, { kind: 'type', name: 'array' })
      }
      const seen = new Set<unknown>()
      for (let i = 0; i < value.length; i++) {
        const outcome = a(value[i])
        if (failed(outcome)) {
          return nested(outcome, { kind: 'index', index: i })
        }
        const key = f ? f(outcome.value) : outcome.value
        if (seen.has(key)) {
          return fail(value[i], { kind: 'unique' }, [ { kind: 'index', index: i } ])
        }
        seen.add(key)
      }
      return ok(value as T[])
    }
