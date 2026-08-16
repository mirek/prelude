import * as V from '@prelude/validation'
import { asserting, type Assert } from './prelude.js'

const bigint_: Assert<bigint> = asserting(V.bigint)

export default bigint_
