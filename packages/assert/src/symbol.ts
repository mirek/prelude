import * as V from '@prelude/validation'
import { asserting, type Assert } from './prelude.js'

const symbol_: Assert<symbol> = asserting(V.symbol)

export default symbol_
