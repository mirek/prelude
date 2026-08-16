import * as V from '@prelude/validation'
import { toValidator, asserting, type Assert } from './prelude.js'

const record = <K extends string | symbol | number, V_>(k: Assert<K>, v: Assert<V_>): Assert<Record<K, V_>> =>
  asserting(V.record(toValidator(k) as V.Validator<K>, toValidator(v) as V.Validator<V_>))

export default record
