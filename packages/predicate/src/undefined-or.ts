import * as V from '@prelude/validation'
import { toValidator, predicating } from './core.js'
import type Predicate from './predicate.js'

const undefinedOr = <T>(a: Predicate<T>): Predicate<undefined | T> => predicating(V.undefinedOr(toValidator(a)))

export default undefinedOr
