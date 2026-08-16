import * as V from '@prelude/validation'
import { toValidator, refuting, type Refute, type Primitive, type Lifted, type IntersectionOfUnion } from './prelude.js'

const and = <Ts extends (Primitive | Refute<unknown>)[]>(...as: Ts): Refute<IntersectionOfUnion<Lifted<Ts[number]>>> =>
  refuting(V.and(...as.map(toValidator)) as V.Validator<IntersectionOfUnion<Lifted<Ts[number]>>>)

export default and
