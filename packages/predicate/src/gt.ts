import * as V from '@prelude/validation'
import { predicating } from './core.js'
import type Predicate from './predicate.js'

const gt = (than: number): Predicate<number> => predicating(V.gt(than))

export default gt
