import * as V from '@prelude/validation'
import { toFail, ok, type Result } from './prelude.js'

const defined = <T>(value: T): Result<Exclude<T, undefined>> => {
  const outcome = V.defined(value)
  return outcome.ok ? ok(outcome.value) : toFail(outcome)
}

export default defined
