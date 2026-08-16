import * as V from '@prelude/validation'
import { predicating } from './core.js'
import type Predicate from './predicate.js'

const bigint_: Predicate<bigint> = predicating(V.bigint)

export default bigint_
