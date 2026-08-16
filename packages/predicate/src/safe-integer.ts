import * as V from '@prelude/validation'
import { predicating } from './core.js'
import type Predicate from './predicate.js'

const safeInteger: Predicate<number> = predicating(V.safeInteger)

export default safeInteger
