import * as V from '@prelude/validation'
import { toValidator, refuting, type Refute, type Primitive, type Lifted } from './prelude.js'

/** Like `object`, but a declared property that is `undefined` is skipped. */
const partial = <T extends Record<string, Primitive | Refute<unknown>>>(kvs: T): Refute<{ [k in keyof T]?: undefined | Lifted<T[k]> }> => {
  const validators: Record<string, V.Validator<unknown>> = Object.create(null)
  for (const k in kvs) {
    validators[k] = toValidator(kvs[k])
  }
  return refuting(V.partial(validators) as V.Validator<{ [k in keyof T]?: undefined | Lifted<T[k]> }>)
}

export default partial
