import * as V from '@prelude/validation'
import { refuting, type Refute } from './prelude.js'

const eq = <T>(a: T): Refute<T> => refuting(V.eq(a))

export default eq
