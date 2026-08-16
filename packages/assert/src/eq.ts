import * as V from '@prelude/validation'
import { asserting, type Assert } from './prelude.js'

/** Asserts strict equality (`===`) with `a`. */
const eq = <T>(a: T): Assert<T> => asserting(V.eq(a))

export default eq
