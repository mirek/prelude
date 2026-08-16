import * as V from '@prelude/validation'
import { predicating } from './core.js'
import type Predicate from './predicate.js'

const gte = (than: number): Predicate<number> => predicating(V.gte(than))

export default gte
