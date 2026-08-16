import * as V from '@prelude/validation'
import { asserting, type Assert } from './prelude.js'

const boolean_: Assert<boolean> = asserting(V.boolean)

export default boolean_
