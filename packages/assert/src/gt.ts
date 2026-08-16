import * as V from '@prelude/validation'
import { asserting, type Assert } from './prelude.js'

const gt = (than: number): Assert<number> => asserting(V.gt(than))

export default gt
