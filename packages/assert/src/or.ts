import * as V from '@prelude/validation'
import { toValidator, asserting, type Assert, type Primitive, type Lifted } from './prelude.js'

const or = <Ts extends (Primitive | Assert<unknown>)[]>(...as: Ts): Assert<Lifted<Ts[number]>> =>
  asserting(V.or(...as.map(toValidator)) as V.Validator<Lifted<Ts[number]>>)

export default or
