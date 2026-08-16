import * as V from '@prelude/validation'
import { refuting, type Refute } from './prelude.js'

const undefined_: Refute<undefined> = refuting(V.undefined_)

export default undefined_
