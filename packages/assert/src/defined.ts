import * as V from '@prelude/validation'
import { toError } from './prelude.js'

const defined = <T>(value: T): Exclude<T, undefined> => {
  const outcome = V.defined(value)
  if (!outcome.ok) {
    throw toError(outcome)
  }
  return outcome.value
}

export default defined
