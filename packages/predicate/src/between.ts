import * as V from '@prelude/validation'
import { predicating } from './core.js'
import type Predicate from './predicate.js'

const between = (min: number, max: number): Predicate<number> => predicating(V.between(min, max))

export default between
