import * as V from '@prelude/validation'
import { asserting, type Assert } from './prelude.js'

const string_: Assert<string> = asserting(V.string)

export default string_
