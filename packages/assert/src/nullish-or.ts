import * as V from '@prelude/validation'
import { toValidator, asserting, type Assert } from './prelude.js'

const nullishOr = <T>(a: Assert<T>): Assert<null | undefined | T> => asserting(V.nullishOr(toValidator(a) as V.Validator<T>))

export default nullishOr
