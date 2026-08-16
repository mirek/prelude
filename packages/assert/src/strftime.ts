import * as V from '@prelude/validation'
import { asserting, type Assert } from './prelude.js'

/** Asserts a string matching the strftime `format` (`%Y-%m-%d`, `%T`, ...). */
const strftime = (format: string): Assert<string> => asserting(V.strftime(format))

export default strftime
