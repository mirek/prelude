import { ok, fail, type Validator } from './prelude.js'

const re = /^(\d{4})-(\d{2})-(\d{2})$/

/** A `YYYY-MM-DD` string naming a real calendar date. */
export const calendarDate: Validator<string> =
  (value: unknown) => {
    if (typeof value !== 'string') {
      return fail(value, { kind: 'type', name: 'string' })
    }
    const match = value.match(re)
    if (!match) {
      return fail(value, { kind: 'calendarDate', problem: 'format' })
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
      return fail(value, { kind: 'calendarDate', problem: 'invalid' })
    }
    return ok(value)
  }

export default calendarDate
