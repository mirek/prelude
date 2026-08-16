import * as V from '@prelude/validation'
import { toValidator, predicating } from './core.js'
import type Predicate from './predicate.js'

/** An array of `a` values that are unique, by `k` when given. */
const unique = <T, R extends number | string = T extends number | string ? T : never>(a: Predicate<T>, k?: (value: T) => R): Predicate<T[]> =>
  predicating(V.unique(toValidator(a), k))

export default unique
