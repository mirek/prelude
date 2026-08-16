import * as V from '@prelude/validation'
import { toValidator, refuting, type Refute } from './prelude.js'

const nullishOr = <T>(a: Refute<T>): Refute<undefined | null | T> => refuting(V.nullishOr(toValidator(a) as V.Validator<T>))

export default nullishOr
