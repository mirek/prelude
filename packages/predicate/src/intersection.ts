import * as V from '@prelude/validation'
import { toValidator, predicating } from './core.js'
import type Predicate from './predicate.js'
import type Predicated from './predicated.js'

type IntersectionOfUnion<T> =
  (T extends unknown ? (_: T) => void : never) extends ((_: infer U) => void) ? U : never

/** Every predicate must hold. */
const intersection = <Ps extends Predicate<unknown>[]>(...as: Ps): Predicate<IntersectionOfUnion<Predicated<Ps[number]>>> =>
  predicating(V.and(...as.map(toValidator)) as V.Validator<IntersectionOfUnion<Predicated<Ps[number]>>>)

export default intersection
