import * as V from '@prelude/validation'
import { asserting, type Assert } from './prelude.js'

const nonBlankString: Assert<string> = asserting(V.nonBlankString)

export default nonBlankString
