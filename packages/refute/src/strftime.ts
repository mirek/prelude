import * as V from '@prelude/validation'
import { refuting, type Refute } from './prelude.js'

export { tokenize, type Token } from '@prelude/validation'

/** Refutes a string not matching the strftime `format`; the failure's `received` is `{ value, index }` with the index where matching stopped. */
const strftime = (f: string): Refute<string> => refuting(V.strftime(f))

export default strftime
