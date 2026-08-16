import * as V from '@prelude/validation'
import { asserting, type Assert } from './prelude.js'

const finite: Assert<number> = asserting(V.finite)

export default finite
