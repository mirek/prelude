import * as V from '@prelude/validation'
import { predicating, toValidator } from './core.js'
import type Predicate from './predicate.js'
import type Predicated from './predicated.js'

/** Any predicate may hold. */
const union = <Ps extends Predicate<unknown>[]>(...as: Ps): Predicate<Predicated<Ps[number]>> =>
  predicating(V.or(...as.map(toValidator)) as V.Validator<Predicated<Ps[number]>>)

export default union
