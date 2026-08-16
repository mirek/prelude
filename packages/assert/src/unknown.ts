import * as V from '@prelude/validation'
import { asserting, type Assert } from './prelude.js'

const unknown_: Assert<unknown> = asserting(V.unknown)

export default unknown_
