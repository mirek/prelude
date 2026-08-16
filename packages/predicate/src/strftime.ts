import * as V from '@prelude/validation'
import { predicating } from './core.js'
import type Predicate from './predicate.js'

/** A string matching the strftime `format` (`%Y-%m-%d`, `%T`, ...). */
const strftime = (f: string): Predicate<string> => predicating(V.strftime(f))

export default strftime
