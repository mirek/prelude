import * as V from '@prelude/validation'
import { refuting, type Refute } from './prelude.js'

const gte = (than: number): Refute<number> => refuting(V.gte(than))

export default gte
