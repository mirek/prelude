import * as V from '@prelude/validation'
import { toValidator, predicating } from './core.js'
import type Predicate from './predicate.js'

const nullOr = <T>(a: Predicate<T>): Predicate<null | T> => predicating(V.nullOr(toValidator(a)))

export default nullOr
