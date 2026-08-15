import * as Reader from './reader.js'
import * as Result from './result.js'
import type * as Parser from './parser.js'

/** @returns the code point at the reader (as a string, one or two code units), `undefined` at end of input. */
export const peekCodePoint =
  (reader: Reader.t, offset = 0): undefined | string => {
    const codePoint = reader.input.codePointAt(reader.offset + offset)
    return codePoint === undefined ?
      undefined :
      String.fromCodePoint(codePoint)
  }

/** @returns parser matching one of provided chars (matched by code point, so astral characters stay whole). */
export function chars(chars_: string): Parser.t<string> {
  const set = new Set(Array.from(chars_))
  return function (reader) {
    const char = peekCodePoint(reader)
    return char !== undefined && set.has(char) ?
      Result.eat(reader, char.length) :
      Result.fail(reader, set.size === 1 ? `Expected char ${chars_}.` : `Expected one of chars ${chars_}.`)
  }
}

export default chars
