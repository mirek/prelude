import * as V from '@prelude/validation'
import { predicating } from './core.js'
import type Predicate from './predicate.js'

/** `null` or `undefined`. */
const nil: Predicate<undefined | null> = predicating(V.nullish)

export default nil
