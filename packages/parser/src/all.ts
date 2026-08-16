import * as Reader from './reader.js'
import * as Result from './result.js'
import type * as Parser from './parser.js'

/**
 * Tries to find all matches, scanning forward by single character.
 * Every offset up to and including the end of input is tried, so parsers matching
 * zero width at the end (`end`, `eol`, `maybe`) contribute a terminal match uniformly
 * for empty and non-empty input alike. A zero-width match advances by one character
 * from where it was found; a consuming match continues from the consumed offset.
 * Always fully consumes reader.
 * @see {@link next} to find single match.
 */
export function all<T>(parser: Parser.t<T>) {
  return (reader: Reader.t) => {
    const values: T[] = []
    const reader_ = Reader.mutable(reader)
    while (true) {
      const result = parser(reader_)
      if (!Result.failed(result)) {
        values.push(result.value)
        if (result.reader.offset > reader_.offset) {
          reader_.offset = result.reader.offset
          continue
        }
      }
      if (Reader.end(reader_)) {
        break
      }
      // Failed or zero-width match, advance by single character from this position.
      reader_.offset++
    }
    return Result.ok(Reader.of(reader.input, reader.input.length), values)
  }
}

export default all
