import * as Parser from './parser.js'
import * as Ast from './ast.js'
import * as Json from './json.js'

export {
  Ast,
  Parser,
  Json
}

export const parse =
  Parser.parse

export const json =
  Json.json
