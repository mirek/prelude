import * as V from '@prelude/validation'
import { asserting, type Assert } from './prelude.js'

const between = (min: number, max: number): Assert<number> => asserting(V.between(min, max))

export default between
