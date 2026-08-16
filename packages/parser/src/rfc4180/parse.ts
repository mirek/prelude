import * as Parser from '../parser.js'
import file from './file.js'
import lit from '../lit.js'
import maybe from '../maybe.js'
import right from '../right.js'

/**
 * RFC 4180 §2.4: spaces are part of a field, so the input is not trimmed.
 * A leading UTF-8 BOM (as emitted by spreadsheet exports) is skipped.
 */
export const parser =
  Parser.parser(right(maybe(lit('\ufeff')), file))

export default parser
