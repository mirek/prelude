import * as V from '@prelude/validation'
import { refuting, type Refute, type Primitive } from './prelude.js'

const oneOf = <T extends Primitive>(...values: readonly T[]): Refute<T> => refuting(V.oneOf(...values))

export default oneOf
