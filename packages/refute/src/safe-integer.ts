import * as V from '@prelude/validation'
import { refuting, type Refute } from './prelude.js'

const safeInteger: Refute<number> = refuting(V.safeInteger)

export default safeInteger
