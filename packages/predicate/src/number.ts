import * as V from '@prelude/validation'
import { predicating } from './core.js'
import type Predicate from './predicate.js'

const number_: Predicate<number> = predicating(V.number)

export default number_
