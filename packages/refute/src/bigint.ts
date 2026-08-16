import * as V from '@prelude/validation'
import { refuting, type Refute } from './prelude.js'

const bigint_: Refute<bigint> = refuting(V.bigint)

export default bigint_
