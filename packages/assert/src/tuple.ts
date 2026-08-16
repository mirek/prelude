import * as V from '@prelude/validation'
import { toValidator, asserting, type Assert, type Asserted } from './prelude.js'

const tuple = <T extends [...Assert<unknown>[]]>(...as: T): Assert<{ [I in keyof T]: Asserted<T[I]> }> =>
  asserting(V.tuple(...as.map(toValidator)) as V.Validator<{ [I in keyof T]: Asserted<T[I]> }>)

export default tuple
