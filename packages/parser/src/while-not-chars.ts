import type * as Parser from './parser.js'
import { peekCodePoint } from './chars.js'
import * as Result from './result.js'

/**
 * Advances while next character is not listed in `chars`.
 *
 * Parser must match at least `min` (default `0`) characters to succeed.
 */
export function whileNotChars(chars: string, min = 0): Parser.t<string> {
  const set = new Set(Array.from(chars))
  return function (reader) {
    let i = 0
    let count = 0
    let char = peekCodePoint(reader, i)
    while (char !== undefined && !set.has(char)) {
      i += char.length
      count++
      char = peekCodePoint(reader, i)
    }
    return count >= min ?
      Result.eat(reader, i) :
      Result.fail(reader, `While not char(s) ${chars} failed for min ${min} (count ${count}).`)
  }
}

export default whileNotChars
