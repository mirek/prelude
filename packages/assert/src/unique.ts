import * as V from '@prelude/validation'
import { toValidator, asserting, type Assert, type Primitive } from './prelude.js'

/** Asserts an array whose validated elements are unique, by `f` when given. */
const unique = <T>(a: Assert<T>, f?: (value: T) => Primitive): Assert<T[]> =>
  asserting(V.unique(toValidator(a) as V.Validator<T>, f))

export default unique
