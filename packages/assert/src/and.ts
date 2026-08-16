import * as V from '@prelude/validation'
import { toValidator, asserting, type Assert, type Primitive, type Lifted, type IntersectionOfUnion } from './prelude.js'

const and = <Ts extends (Primitive | Assert<unknown>)[]>(...as: Ts): Assert<IntersectionOfUnion<Lifted<Ts[number]>>> =>
  asserting(V.and(...as.map(toValidator)) as V.Validator<IntersectionOfUnion<Lifted<Ts[number]>>>)

export default and
