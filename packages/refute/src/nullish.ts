import * as V from '@prelude/validation'
import { refuting, type Refute } from './prelude.js'

const nullish: Refute<undefined | null> = refuting(V.nullish)

export default nullish
