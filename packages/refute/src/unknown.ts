import * as V from '@prelude/validation'
import { refuting, type Refute } from './prelude.js'

const unknown_: Refute<unknown> = refuting(V.unknown)

export default unknown_
