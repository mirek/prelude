import * as V from '@prelude/validation'
import { toValidator, asserting, type Assert, type Primitive, type Lifted } from './prelude.js'

/** Like `object`, but a declared property that is `undefined` is skipped. */
const partial = <T extends Record<string, Primitive | Assert<unknown>>>(kvs: T): Assert<{ [k in keyof T]?: undefined | Lifted<T[k]> }> => {
  const validators: Record<string, V.Validator<unknown>> = Object.create(null)
  for (const k in kvs) {
    validators[k] = toValidator(kvs[k])
  }
  return asserting(V.partial(validators) as V.Validator<{ [k in keyof T]?: undefined | Lifted<T[k]> }>)
}

export default partial
