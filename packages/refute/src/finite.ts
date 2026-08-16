import * as V from '@prelude/validation'
import { refuting, type Refute } from './prelude.js'

const finite: Refute<number> = refuting(V.finite)

export default finite
