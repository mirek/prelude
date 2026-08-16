import * as V from '@prelude/validation'
import { predicating } from './core.js'
import type Predicate from './predicate.js'

const nonBlankString: Predicate<string> = predicating(V.nonBlankString)

export default nonBlankString
