import * as V from '@prelude/validation'
import { toValidator, refuting, type Refute } from './prelude.js'

const undefinedOr = <T>(a: Refute<T>): Refute<undefined | T> => refuting(V.undefinedOr(toValidator(a) as V.Validator<T>))

export default undefinedOr
