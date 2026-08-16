import * as V from '@prelude/validation'
import { predicating } from './core.js'
import type Predicate from './predicate.js'

/** `Object.is` equality (distinguishes -0 and matches NaN). */
const is = <T>(expected: T): Predicate<T> => predicating(V.is(expected))

export default is
