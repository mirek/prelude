import * as V from '@prelude/validation'
import { asserting, type Assert } from './prelude.js'

/** Asserts a `YYYY-MM-DD` string naming a real calendar date. */
const calendarDate: Assert<string> = asserting(V.calendarDate)

export default calendarDate
