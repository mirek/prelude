import * as V from '@prelude/validation'
import { toValidator, predicating } from './core.js'
import type Predicate from './predicate.js'
import type Predicated from './predicated.js'

/** Like `object` (own properties only), and no other own key may be present. */
const exact = <T extends Record<string, Predicate<unknown>>>(kvs: T): Predicate<{ [k in keyof T]: Predicated<T[k]> }> => {
  const validators: Record<string, V.Validator<unknown>> = Object.create(null)
  for (const k in kvs) {
    validators[k] = toValidator(kvs[k])
  }
  return predicating(V.exact(validators) as V.Validator<{ [k in keyof T]: Predicated<T[k]> }>)
}

export default exact
