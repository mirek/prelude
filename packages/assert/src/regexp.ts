import * as V from '@prelude/validation'
import { asserting, type Assert } from './prelude.js'

const regexp = (re: RegExp): Assert<string> => asserting(V.regexp(re))

export default regexp
