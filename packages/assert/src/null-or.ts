import * as V from '@prelude/validation'
import { toValidator, asserting, type Assert } from './prelude.js'

const nullOr = <T>(a: Assert<T>): Assert<null | T> => asserting(V.nullOr(toValidator(a) as V.Validator<T>))

export default nullOr
