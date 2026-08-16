import * as V from '@prelude/validation'
import { toValidator, asserting, type Assert, type Primitive, type Lifted } from './prelude.js'

/** Like `partial` (own properties only), and no other own key may be present. */
const exactPartial = <T extends Record<string, Primitive | Assert<unknown>>>(kvs: T): Assert<{ [k in keyof T]?: undefined | Lifted<T[k]> }> => {
  const validators: Record<string, V.Validator<unknown>> = Object.create(null)
  for (const k in kvs) {
    validators[k] = toValidator(kvs[k])
  }
  return asserting(V.exactPartial(validators) as V.Validator<{ [k in keyof T]?: undefined | Lifted<T[k]> }>)
}

export default exactPartial
