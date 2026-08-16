import * as V from '@prelude/validation'
import { refuting, type Refute } from './prelude.js'

const null_: Refute<null> = refuting(V.null_)

export default null_
