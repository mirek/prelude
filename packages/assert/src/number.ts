import * as V from '@prelude/validation'
import { asserting, type Assert } from './prelude.js'

const number_: Assert<number> = asserting(V.number)

export default number_
