import * as V from '@prelude/validation'
import { toValidator, refuting, type Refute, type Primitive } from './prelude.js'

/** Refutes an array whose validated elements are unique, by `f` when given. */
const unique = <T>(a: Refute<T>, f?: (value: T) => Primitive): Refute<T[]> =>
  refuting(V.unique(toValidator(a) as V.Validator<T>, f))

export default unique
