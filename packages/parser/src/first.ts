import * as Result from './result.js'
import type * as Parser from './parser.js'
import type * as Reader from './reader.js'

const reentry = new WeakMap<Reader.t, Set<Parser.t>>()

function make(reader: Reader.t) {
  const set = new Set<Parser.t>()
  reentry.set(reader, set)
  return set
}

/** Union where first successful match is returned. */
export function first<T extends Parser.t[]>(...parsers: T): T[number] {
  return function (reader) {
    const set = reentry.get(reader) ?? make(reader)
    for (const parser of parsers) {
      if (set.has(parser)) {
        continue
      }
      set.add(parser)
      let result: Result.t<unknown>
      try {
        result = parser(reader)
      } finally {
        // A throwing alternative must not leave its reentry mark behind (later calls would skip it).
        set.delete(parser)
      }
      if (!Result.failed(result)) {
        return result as Result.Ok<T[number]>
      }
    }
    return Result.fail(reader, `None of ${parsers.length} alternatives matched at ${reader.offset}.`)
  }
}

export default first
