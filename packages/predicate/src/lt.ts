import * as V from '@prelude/validation'
import { predicating } from './core.js'
import type Predicate from './predicate.js'

const lt = (than: number): Predicate<number> => predicating(V.lt(than))

export default lt
