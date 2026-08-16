import * as V from '@prelude/validation'
import { predicating } from './core.js'
import type Predicate from './predicate.js'

const undefined_: Predicate<undefined> = predicating(V.undefined_)

export default undefined_
