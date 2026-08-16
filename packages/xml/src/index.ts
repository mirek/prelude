import * as Ast from './ast.js'
import * as Json from './json.js'
import * as Name from './name.js'
import { parse } from './parser.js'
import XmlError from './error.js'

export {
  Ast,
  Json,
  Name,
  XmlError,
  parse
}

export const json =
  Json.json

export default parse
