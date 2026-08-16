import * as V from '@prelude/validation'
import { refuting, type Refute } from './prelude.js'

const symbol_: Refute<symbol> = refuting(V.symbol)

export default symbol_
