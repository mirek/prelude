import * as V from '@prelude/validation'
import { predicating } from './core.js'
import type Predicate from './predicate.js'

/** A `YYYY-MM-DD` string naming a real calendar date. */
const calendarDate: Predicate<string> = predicating(V.calendarDate)

export default calendarDate
