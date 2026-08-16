import * as V from '@prelude/validation'
import { asserting, type Assert } from './prelude.js'

const false_: Assert<false> = asserting(V.false_)

export default false_
