export type t = Date
export const constructor = Date
export const name = 'Date'

/** Invalid dates (structured clone supports them) are encoded as the string `Invalid Date`, which `Date` parses back to an invalid date. */
export const encode =
  (value: t) =>
    ({ '^Date$': Number.isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString() })

export const decode =
  (value: unknown): t => {
    if (typeof value !== 'string') {
      throw new Error(`Expected string, got ${typeof value}.`)
    }
    return new Date(value)
  }
