import * as V from '@prelude/validation'
import { predicating } from './core.js'
import type Predicate from './predicate.js'

const null_: Predicate<null> = predicating(V.null_)

export default null_
