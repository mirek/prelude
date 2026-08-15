import type * as Parser from './parser.js'
import { peekCodePoint } from './chars.js'
import * as Result from './result.js'

/** Matches any char listed in `chars` at least `min` (default `0`) times. */
export function whileChars(chars: string, min = 0): Parser.t<string> {
  const set = new Set(Array.from(chars))
  return function (reader) {
    let i = 0
    let char = peekCodePoint(reader, i)
    while (char !== undefined && set.has(char)) {
      i += char.length
      char = peekCodePoint(reader, i)
    }
    return i >= min ?
      Result.eat(reader, i) :
      Result.fail(reader, `While char(s) ${chars} failed for min ${min} (i ${i}).`)
  }
}

export default whileChars
