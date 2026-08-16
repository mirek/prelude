import * as V from '@prelude/validation'
import { refuting, type Refute, type Primitive, type Lifted } from './prelude.js'

/** A primitive becomes an equality refute (a RegExp a match, `null` the null refute); refutes pass through. */
const lift = <T extends Primitive | Refute<unknown>>(a: T): Refute<Lifted<T>> =>
  typeof a === 'function' ? a as Refute<Lifted<T>> : refuting(V.lift(a) as V.Validator<Lifted<T>>)

export default lift
