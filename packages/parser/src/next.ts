import * as Reader from './reader.js'
import * as Result from './result.js'
import lift from './lift.js'
import type * as Parser from './parser.js'

/**
 * Tries to next match for provided parser.
 * @see {@link all} to list all matches.
 * @see {@link until} to access head and tail of match.
 */
export function next<T extends Parser.Liftable>(parser: T): Parser.t<Parser.Parsed<T>> {
  const parser_ = lift(parser)
  return (reader: Reader.t) => {
    const reader_ = Reader.mutable(reader)
    // Try every offset up to and including the end of input (parsers such as `end` match there).
    while (true) {
      const result = parser_(reader_)
      if (!Result.failed(result)) {
        return result as Result.t<Parser.Parsed<T>>
      }
      if (Reader.end(reader_)) {
        return Result.fail(reader, 'next match not found')
      }
      reader_.offset++
    }
  }
}

export default next
