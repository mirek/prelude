import * as V from '@prelude/validation'
import { asserting, type Assert } from './prelude.js'

/** Asserts `Object.is` equality with `a`. */
const is = <T>(a: T): Assert<T> => asserting(V.is(a))

export default is
