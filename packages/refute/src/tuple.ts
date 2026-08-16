import * as V from '@prelude/validation'
import { toValidator, refuting, type Refute, type Refuted } from './prelude.js'

const tuple = <T extends [...Refute<unknown>[]]>(...as: T): Refute<{ [I in keyof T]: Refuted<T[I]> }> =>
  refuting(V.tuple(...as.map(toValidator)) as V.Validator<{ [I in keyof T]: Refuted<T[I]> }>)

export default tuple
