import * as V from '@prelude/validation'
import { predicating } from './core.js'
import type Predicate from './predicate.js'

const positive: Predicate<number> = predicating(V.positive)

export default positive
