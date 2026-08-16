import * as V from '@prelude/validation'
import { refuting, type Refute } from './prelude.js'

const boolean_: Refute<boolean> = refuting(V.boolean)

export default boolean_
