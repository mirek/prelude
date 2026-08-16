import * as V from '@prelude/validation'
import { toValidator, refuting, type Refute, type Primitive, type Lifted } from './prelude.js'

const or = <Ts extends (Primitive | Refute<unknown>)[]>(...as: Ts): Refute<Lifted<Ts[number]>> =>
  refuting(V.or(...as.map(toValidator)) as V.Validator<Lifted<Ts[number]>>)

export default or
