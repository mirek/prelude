import * as Result from './result.js'
import type * as Parser from './parser.js'

/**
 * @returns parser matching provided character `ranges`.
 * @example
 *   charRange('09azAZ') // equivalent to /[0-9a-zA-Z]/ regexp.
 */
export function charRange(ranges: string): Parser.t<string> {
  // Ranges are pairs of code points, so astral bounds (and astral input) are handled whole.
  const bounds = Array.from(ranges, char => char.codePointAt(0) as number)
  return function (reader) {
    const codePoint = reader.input.codePointAt(reader.offset)
    if (codePoint === undefined) {
      return Result.fail(reader, 'End of input.')
    }
    for (let i = 0; i < bounds.length; i += 2) {
      if (bounds[i] <= codePoint && codePoint <= bounds[i + 1]) {
        const c = String.fromCodePoint(codePoint)
        return Result.ok(reader, c, c.length)
      }
    }
    return Result.fail(reader, `Not in char range ${ranges}.`)
  }
}

export default charRange
