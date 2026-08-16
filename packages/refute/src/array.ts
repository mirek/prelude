import * as V from '@prelude/validation'
import { toValidator, refuting, type Refute } from './prelude.js'

const array = <T>(a: Refute<T>): Refute<T[]> => refuting(V.array(toValidator(a) as V.Validator<T>))

export default array
