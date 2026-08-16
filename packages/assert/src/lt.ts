import * as V from '@prelude/validation'
import { asserting, type Assert } from './prelude.js'

const lt = (than: number): Assert<number> => asserting(V.lt(than))

export default lt
