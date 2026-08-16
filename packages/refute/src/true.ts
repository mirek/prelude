import * as V from '@prelude/validation'
import { refuting, type Refute } from './prelude.js'

const true_: Refute<true> = refuting(V.true_)

export default true_
