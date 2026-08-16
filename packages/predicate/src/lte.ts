import * as V from '@prelude/validation'
import { predicating } from './core.js'
import type Predicate from './predicate.js'

const lte = (than: number): Predicate<number> => predicating(V.lte(than))

export default lte
