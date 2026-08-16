import * as V from '@prelude/validation'
import { predicating } from './core.js'
import type Predicate from './predicate.js'

type Primitive =
  | undefined
  | null
  | boolean
  | number
  | string
  | symbol

const eq = <T extends Primitive>(expected: T): Predicate<T> => predicating(V.eq(expected))

export default eq
