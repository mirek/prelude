import * as V from '@prelude/validation'
import { predicating } from './core.js'
import type Predicate from './predicate.js'

const unknown_: Predicate<unknown> = predicating(V.unknown)

export default unknown_
