import * as V from '@prelude/validation'
import { predicating } from './core.js'
import type Predicate from './predicate.js'

const symbol_: Predicate<symbol> = predicating(V.symbol)

export default symbol_
