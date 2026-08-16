import * as V from '@prelude/validation'
import { toValidator, refuting, type Refute } from './prelude.js'

const record = <K extends string | symbol | number, V_>(k: Refute<K>, v: Refute<V_>): Refute<Record<K, V_>> =>
  refuting(V.record(toValidator(k) as V.Validator<K>, toValidator(v) as V.Validator<V_>))

export default record
