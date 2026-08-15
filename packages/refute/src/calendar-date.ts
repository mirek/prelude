import { ok, fail, type Refute } from './prelude.js'

const re = /^(\d{4})-(\d{2})-(\d{2})$/

const calendarDate: Refute<string> =
  (value: unknown) => {
    if (typeof value !== 'string') {
      return fail(value, 'expected string')
    }
    const match = value.match(re)
    if (!match) {
      return fail(value, 'expected YYYY-MM-DD string')
    }
    // `new Date('2025-02-30')` rolls over to March 2nd, so compare the parsed fields back.
    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])
    // Date.UTC maps years 0..99 to 1900..1999; set the full year explicitly.
    const date = new Date(0)
    date.setUTCFullYear(year, month - 1, day)
    if (
      isNaN(date.getTime()) ||
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return fail(value, 'expected valid date')
    }
    return ok(value)
  }

export default calendarDate
