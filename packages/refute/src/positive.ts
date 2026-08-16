import * as V from '@prelude/validation'
import { refuting, type Refute } from './prelude.js'

const positive: Refute<number> = refuting(V.positive)

export default positive
