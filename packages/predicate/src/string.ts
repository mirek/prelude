import * as V from '@prelude/validation'
import { predicating } from './core.js'
import type Predicate from './predicate.js'

const string_: Predicate<string> = predicating(V.string)

export default string_
