import * as V from '@prelude/validation'
import { toValidator, predicating } from './core.js'
import type Predicate from './predicate.js'

const array = <T>(a: Predicate<T>): Predicate<T[]> => predicating(V.array(toValidator(a)))

export default array
