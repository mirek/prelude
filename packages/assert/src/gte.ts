import * as V from '@prelude/validation'
import { asserting, type Assert } from './prelude.js'

const gte = (than: number): Assert<number> => asserting(V.gte(than))

export default gte
