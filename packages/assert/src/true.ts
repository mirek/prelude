import * as V from '@prelude/validation'
import { asserting, type Assert } from './prelude.js'

const true_: Assert<true> = asserting(V.true_)

export default true_
