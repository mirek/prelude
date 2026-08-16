import * as V from '@prelude/validation'
import { toValidator, predicating } from './core.js'
import type Predicate from './predicate.js'

const nilOr = <T>(a: Predicate<T>): Predicate<undefined | null | T> => predicating(V.nullishOr(toValidator(a)))

export default nilOr
