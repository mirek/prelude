import * as V from '@prelude/validation'
import { refuting, type Refute } from './prelude.js'

const false_: Refute<false> = refuting(V.false_)

export default false_
