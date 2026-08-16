import { ok, fail, type Constructor, type Primitive, type Validator } from './prelude.js'

/** Strict equality (`===`). */
export const eq =
  <T>(expected: T): Validator<T> =>
    value =>
      value === expected ?
        ok(value as T) :
        fail(value, { kind: 'literal', value: expected })

/** `Object.is` equality (distinguishes -0 and matches NaN). */
export const is =
  <T>(expected: T): Validator<T> =>
    value =>
      Object.is(value, expected) ?
        ok(value as T) :
        fail(value, { kind: 'is', value: expected })

export const oneOf =
  <T extends Primitive>(...values: readonly T[]): Validator<T> =>
    value => {
      for (let i = 0; i < values.length; i++) {
        if (values[i] === value) {
          return ok(value as T)
        }
      }
      return fail(value, { kind: 'oneOf', values })
    }

export const regexp =
  (re: RegExp): Validator<string> =>
    value => {
      if (typeof value !== 'string') {
        return fail(value, { kind: 'type', name: 'string' })
      }
      // A global or sticky regexp keeps lastIndex between calls, making test() alternate results.
      // Only those flags make test() write lastIndex, so leave other (possibly frozen) regexps untouched.
      if (re.global || re.sticky) {
        re.lastIndex = 0
      }
      return re.test(value) ?
        ok(value) :
        fail(value, { kind: 'regexp', regexp: re })
    }

export const instance =
  <T extends Constructor>(constructor: T): Validator<InstanceType<T>> =>
    value =>
      value instanceof constructor ?
        ok(value as InstanceType<T>) :
        fail(value, { kind: 'instance', constructor })
