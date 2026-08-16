import { ok, fail, failed, nested, type Failure, type IntersectionOfUnion, type Lifted, type Primitive, type Validator } from './prelude.js'
import { null_ } from './primitives.js'
import { eq, regexp } from './literals.js'

/** Turns a primitive into an equality validator (a RegExp into a match, `null` into `null_`); validators pass through. */
export const lift =
  <T extends Primitive | Validator<unknown>>(a: T): Validator<Lifted<T>> => {
    switch (typeof a) {
      case 'function':
        return a as Validator<Lifted<T>>
      case 'string':
      case 'number':
      case 'boolean':
      case 'undefined':
      case 'bigint':
      case 'symbol':
        return eq(a) as Validator<Lifted<T>>
      case 'object': {
        if (a === null) {
          return null_ as Validator<Lifted<T>>
        }
        if (a instanceof RegExp) {
          return regexp(a) as Validator<Lifted<T>>
        }
        throw new TypeError(`Can't lift ${String(a)}.`)
      }
      default:
        throw new TypeError(`Can't lift ${String(a)}.`)
    }
  }

/** First alternative that accepts wins; otherwise a `union` failure holding every alternative's failure. */
export const or =
  <Ts extends (Primitive | Validator<unknown>)[]>(...as: Ts): Validator<Lifted<Ts[number]>> => {
    const validators = as.map(lift)
    return value => {
      const failures: Failure[] = []
      for (const validator of validators) {
        const outcome = validator(value)
        if (!failed(outcome)) {
          return outcome as { ok: true, value: Lifted<Ts[number]> }
        }
        failures.push(outcome)
      }
      return fail(value, { kind: 'union', failures })
    }
  }

/** Every validator must accept; the first failure is returned as is. */
export const and =
  <Ts extends (Primitive | Validator<unknown>)[]>(...as: Ts): Validator<IntersectionOfUnion<Lifted<Ts[number]>>> => {
    const validators = as.map(lift)
    return value => {
      for (const validator of validators) {
        const outcome = validator(value)
        if (failed(outcome)) {
          return outcome
        }
      }
      return ok(value as IntersectionOfUnion<Lifted<Ts[number]>>)
    }
  }

const orAlternative =
  <A>(alternative: 'null' | 'undefined' | 'nullish', accepts: (value: unknown) => value is A) =>
    <T>(a: Validator<T>): Validator<A | T> =>
      value => {
        if (accepts(value)) {
          return ok(value)
        }
        const outcome = a(value)
        return failed(outcome) ?
          nested(outcome, { kind: 'or', alternative }) :
          outcome
      }

/** Accepts `null` or whatever `a` accepts; a failure of `a` is marked with the `or` segment. */
export const nullOr = orAlternative('null', (value): value is null => value === null)
export const undefinedOr = orAlternative('undefined', (value): value is undefined => value === undefined)
export const nullishOr = orAlternative('nullish', (value): value is null | undefined => value == null)
