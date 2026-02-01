import * as P from '@prelude/parser'
import * as Ast from './ast.js'
import * as Name from './name.js'

export * from '@prelude/parser'

export {
  Ast
}

/** Xml name without scope. */
export const localName =
  P.re(/[^<>\s"'=/:]+/)

/** Xml name with or without scope. */
export const name: P.t<Ast.Name> =
  P.map(P.seq(localName, P.maybe(P.right(':', localName))), _ => _[1] == null ? _[0] : ({
    namespace: _[0],
    name: _[1]
  }))

/** Single quoted string value. */
export const qstring =
  P.betweenLiterals('\'', '\'')

/** Double quoted string value. */
export const dstring =
  P.betweenLiterals('"', '"')

/** Single or double quoted string value. */
export const string =
  P.either(qstring, dstring)

/** Xml attribute. */
export const attribute: P.t<Ast.Attribute> =
  P.map(P.seq(P.ws1, name, P.ws0, '=', P.ws0, string), _ => ({
    type: 'Attribute' as const,
    name: _[1],
    value: _[5]
  }))

/** Zero or more xml attributes. */
export const attributes: P.t<Ast.Attribute[]> =
  P.star(attribute)

/** Xml processing instruction. */
export const processingInstruction: P.t<Ast.ProcessingInstruction> =
  P.map(P.right(P.ws0, P.betweenLiterals('<?', '?>')), value => ({
    type: 'ProcessingInstruction' as const,
    value
  }))

/** Xml comment. */
export const comment: P.t<Ast.Comment> =
  P.map(P.right(P.ws0, P.betweenLiterals('<!--', '-->')), value => ({
    type: 'Comment' as const,
    value
  }))

/** Xml text. */
export const text: P.t<Ast.Text> =
  P.map(P.whileNotChars('<', 1), value => ({
    type: 'Text' as const,
    value
  }))

/** Xml cdata. */
export const cdata: P.t<Ast.Cdata> =
  P.map(P.right(P.ws0, P.betweenLiterals('<![CDATA[', ']]>')), value => ({
    type: 'Cdata' as const,
    value
  }))

/** Xml doctype. */
export const doctype: P.t<Ast.Doctype> =
  P.map(P.right(P.ws0, P.betweenLiterals('<!DOCTYPE', ']>')), value => ({
    type: 'Doctype' as const,
    value
  }))

/** Xml end tag. */
export const endtag =
  P.map(P.seq(P.ws0, '</', P.ws0, name, P.ws0, '>'), _ => _[3])

/**
 * Represents the rest of an empty or non-empty element.
 * @internal
 */
export type ElementRest = {
  items: Ast.Item[],
  name: null | Ast.Name
}

/**
 * The rest of an empty or non-empty element.
 * @internal
 */
export const elementRest: P.t<ElementRest> =
  P.lazy(() => P.either(
    P.map('/>', () => ({ items: [], name: null })),
    P.map(P.seq('>', P.star(item), endtag), _ => ({ items: _[1], name: _[2] })) // eslint-disable-line no-use-before-define
  ))

/** Xml element. */
export const element: P.t<Ast.Element> =
  P.map(
    P.predicate(
      P.seq(P.ws0, '<', name, attributes, P.ws0, elementRest),
      _ => _[5].name === null || Name.eq(_[2], _[5].name)
    ),
    _ => ({
      type: 'Element' as const,
      name: _[2],
      attributes: _[3] ?? [],
      items: _[5].items
    })
  )

/** Xml item. */
export const item: P.t<Ast.Item> =
  P.switch({
    '<?': processingInstruction,
    '<!--': comment,
    '<![CDATA[': cdata,
    '<!DOCTYPE': doctype,
    '<': element,
    // '</': endtag,
    '': text
  }) as P.t<Ast.Item>

/** Xml document. */
export const document: P.t<Ast.Document> =
  P.map(P.seq(P.star(P.or(processingInstruction, doctype, comment)), element, P.star(P.or(P.ws1, comment, processingInstruction)), P.ws0), _ => ({
    type: 'Document' as const,
    prelude: _[0],
    root: _[1]
  }))

/** Xml parser. */
export const parse =
  P.parser(document)

export default parse
