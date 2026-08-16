import * as V from '@prelude/validation'
import { asserting, type Assert } from './prelude.js'

const safeInteger: Assert<number> = asserting(V.safeInteger)

export default safeInteger
