import * as V from '@prelude/validation'
import { refuting, type Refute } from './prelude.js'

const lt = (than: number): Refute<number> => refuting(V.lt(than))

export default lt
