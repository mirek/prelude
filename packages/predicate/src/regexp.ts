import * as V from '@prelude/validation'
import { predicating } from './core.js'
import type Predicate from './predicate.js'

const regexp = (re: RegExp): Predicate<string> => predicating(V.regexp(re))

export default regexp
