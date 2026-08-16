import * as V from '@prelude/validation'
import { refuting, type Refute } from './prelude.js'

const regexp = (re: RegExp): Refute<string> => refuting(V.regexp(re))

export default regexp
