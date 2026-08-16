import * as V from '@prelude/validation'
import { toValidator, predicating } from './core.js'
import type Predicate from './predicate.js'
import type Predicated from './predicated.js'

const tuple = <Ps extends [...Predicate<unknown>[]]>(...ps: Ps): Predicate<{ [I in keyof Ps]: Predicated<Ps[I]> }> =>
  predicating(V.tuple(...ps.map(toValidator)) as V.Validator<{ [I in keyof Ps]: Predicated<Ps[I]> }>)

export default tuple
