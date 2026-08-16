import * as V from '@prelude/validation'
import { asserting, type Assert } from './prelude.js'

const null_: Assert<null> = asserting(V.null_)

export default null_
