import * as V from '@prelude/validation'
import { asserting, type Assert, type Primitive } from './prelude.js'

const oneOf = <T extends Primitive>(...values: readonly T[]): Assert<T> => asserting(V.oneOf(...values))

export default oneOf
