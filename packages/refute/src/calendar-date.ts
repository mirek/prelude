import * as V from '@prelude/validation'
import { refuting, type Refute } from './prelude.js'

const calendarDate: Refute<string> = refuting(V.calendarDate)

export default calendarDate
