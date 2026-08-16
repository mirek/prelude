import * as V from '@prelude/validation'
import { toValidator, type Assert } from './prelude.js'

/** Turns an assert into a type guard: `true` when it accepts, `false` when it throws an AssertionError. */
const predicate = <T>(a: Assert<T>) => {
  const validator = toValidator(a) as V.Validator<T>
  return V.wrapped((value: unknown): value is T => validator(value).ok, validator)
}

export default predicate
