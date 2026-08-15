import * as P from './parser.js'
import between from './between.js'
import charRange from './char-range.js'
import either from './either.js'
import join from './join.js'
import lit from './lit.js'
import ltrim from './ltrim.js'
import jsonString from './rfc8259/string.js'
import sep0 from './sep0.js'
import star from './star.js'
import trim from './trim.js'
import type * as Reader from './reader.js'
import type * as Result from './result.js'
import ws1 from './ws1.js'

export type Sexp =
  string | Sexp[]

export type t =
  Sexp

export const lparen =
  trim()('(')

/** Eats whitespace before `)` only: whitespace after it separates the list from a following element. */
export const rparen =
  ltrim()(lit(')'))

export const unquoted =
  join(star(charRange('09azAZ'), 1))

export const string: P.t<string> =
  either(unquoted, jsonString)

export function sexp(reader: Reader.t): Result.t<Sexp> {
  return between(lparen, rparen, sep0(ws1, either(string, sexp)))(reader)
}

export const parser =
  P.parser(trim()(sexp))

export default parser
