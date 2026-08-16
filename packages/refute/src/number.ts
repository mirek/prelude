import * as V from '@prelude/validation'
import { refuting, type Refute } from './prelude.js'

const number_: Refute<number> = refuting(V.number)

export default number_
