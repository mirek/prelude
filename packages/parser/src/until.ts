import * as Parser from './parser.js'
import * as Reader from './reader.js'
import * as Result from './result.js'
import lift from './lift.js'

/** @returns parser that consumes reader until tail-parser succeeds. */
export const until =
  <T extends Parser.Liftable>(parser: T): Parser.t<{ head: string, tail: Parser.Parsed<T> }> => {
    const parser_ = lift(parser)
    return (reader: Reader.t) => {
      const reader_ = Reader.mutable(reader)
      // Try every offset up to and including the end of input, so parsers that match there
      // (`end`, `eol`, `maybe`) can terminate the head.
      while (true) {
        const result = parser_(reader_)
        if (!Result.failed(result)) {
          const length = reader_.offset - reader.offset
          return Result.ok(result.reader, {
            head: Reader.slice(reader, 0, length),
            tail: result.value as Parser.Parsed<T>
          })
        }
        if (Reader.end(reader_)) {
          return Result.fail(reader, 'reached end of input')
        }
        reader_.offset++
      }
    }
  }

export default until
