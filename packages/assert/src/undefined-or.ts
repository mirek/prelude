import * as V from '@prelude/validation'
import { toValidator, asserting, type Assert } from './prelude.js'

const undefinedOr = <T>(a: Assert<T>): Assert<undefined | T> => asserting(V.undefinedOr(toValidator(a) as V.Validator<T>))

export default undefinedOr
