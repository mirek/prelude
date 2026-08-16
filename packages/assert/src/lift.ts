import * as V from '@prelude/validation'
import { asserting, type Assert, type Primitive, type Lifted } from './prelude.js'

/** A primitive becomes an equality assert (a RegExp a match, `null` the null assert); asserts pass through. */
const lift = <T extends Primitive | Assert<unknown>>(a: T): Assert<Lifted<T>> =>
  typeof a === 'function' ? a as Assert<Lifted<T>> : asserting(V.lift(a) as V.Validator<Lifted<T>>)

export default lift
