import * as V from '@prelude/validation'
import { refuting, type Refute } from './prelude.js'

const string_: Refute<string> = refuting(V.string)

export default string_
