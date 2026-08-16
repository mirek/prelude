import * as V from '@prelude/validation'
import { refuting, type Refute } from './prelude.js'

const gt = (than: number): Refute<number> => refuting(V.gt(than))

export default gt
