import * as V from '@prelude/validation'
import { predicating } from './core.js'
import type Predicate from './predicate.js'

const finite: Predicate<number> = predicating(V.finite)

export default finite
