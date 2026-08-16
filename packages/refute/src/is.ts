import * as V from '@prelude/validation'
import { refuting, type Refute } from './prelude.js'

const is = <T>(a: T): Refute<T> => refuting(V.is(a))

export default is
