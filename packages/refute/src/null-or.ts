import * as V from '@prelude/validation'
import { toValidator, refuting, type Refute } from './prelude.js'

const nullOr = <T>(a: Refute<T>): Refute<null | T> => refuting(V.nullOr(toValidator(a) as V.Validator<T>))

export default nullOr
