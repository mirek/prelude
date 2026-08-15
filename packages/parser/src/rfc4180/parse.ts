import * as Parser from '../parser.js'
import file from './file.js'

/** RFC 4180 §2.4: spaces are part of a field, so the input is not trimmed. */
export const parser =
  Parser.parser(file)

export default parser
