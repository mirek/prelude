import * as V from '@prelude/validation'
import { refuting, type Refute } from './prelude.js'

const nonBlankString: Refute<string> = refuting(V.nonBlankString)

export default nonBlankString
