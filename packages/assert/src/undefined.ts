import * as V from '@prelude/validation'
import { asserting, type Assert } from './prelude.js'

const undefined_: Assert<undefined> = asserting(V.undefined_)

export default undefined_
