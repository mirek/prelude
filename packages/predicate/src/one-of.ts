import * as V from '@prelude/validation'
import { predicating } from './core.js'
import type Predicate from './predicate.js'

const oneOf = <T extends undefined | null | boolean | number | string | symbol>(...values: readonly T[]): Predicate<T> => predicating(V.oneOf(...values))

export default oneOf
