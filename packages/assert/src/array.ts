import * as V from '@prelude/validation'
import { toValidator, asserting, type Assert } from './prelude.js'

const array_ = <T>(a: Assert<T>): Assert<T[]> => asserting(V.array(toValidator(a) as V.Validator<T>))

export default array_
