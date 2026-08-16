import * as V from '@prelude/validation'
import { asserting, type Assert } from './prelude.js'

const positive: Assert<number> = asserting(V.positive)

export default positive
