import * as V from '@prelude/validation'
import { predicating } from './core.js'
import type Predicate from './predicate.js'

const boolean_: Predicate<boolean> = predicating(V.boolean)

export default boolean_
