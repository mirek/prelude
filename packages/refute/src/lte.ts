import * as V from '@prelude/validation'
import { refuting, type Refute } from './prelude.js'

const lte = (than: number): Refute<number> => refuting(V.lte(than))

export default lte
