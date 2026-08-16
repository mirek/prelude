import * as V from '@prelude/validation'
import { refuting, type Refute } from './prelude.js'

export const between = (min: number, max: number): Refute<number> => refuting(V.between(min, max))

export default between
