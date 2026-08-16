import * as V from '@prelude/validation'
import { toValidator, predicating } from './core.js'
import type Predicate from './predicate.js'

/** A record whose values satisfy `v` and whose keys satisfy `k` (strings by default). */
const record = <V_, K extends symbol | number | string = string>(v: Predicate<V_>, k?: Predicate<K>): Predicate<Record<K, V_>> =>
  predicating(V.record(k ? toValidator(k) : V.string as V.Validator<K>, toValidator(v)))

export default record
