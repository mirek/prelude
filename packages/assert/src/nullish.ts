import * as V from '@prelude/validation'
import { asserting, type Assert } from './prelude.js'

const nullish: Assert<undefined | null> = asserting(V.nullish)

export default nullish
