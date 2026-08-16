# Xml

An XML 1.0 parser with namespace processing. `parse` turns a document into a small tagged AST; `json` converts an element tree into plain objects. Errors carry the offset, line and column where the document stopped being well-formed.

# Usage

```bash
npm i -E @prelude/xml
```

```ts
import * as Xml from '@prelude/xml'

const document = Xml.parse('<note id="1" xmlns:x="urn:x"><x:to>Ada &amp; Bob</x:to></note>')
document.root
// {
//   type: 'Element',
//   name: { prefix: '', local: 'note', namespace: undefined },
//   attributes: [
//     { type: 'Attribute', name: { prefix: '', local: 'id', namespace: undefined }, value: '1' },
//     { type: 'Attribute', name: { prefix: 'xmlns', local: 'x', namespace: 'http://www.w3.org/2000/xmlns/' }, value: 'urn:x' }
//   ],
//   items: [ { type: 'Element', name: { prefix: 'x', local: 'to', namespace: 'urn:x' }, attributes: [], items: [ { type: 'Text', value: 'Ada & Bob' } ] } ]
// }

try {
  Xml.parse('<a><b></a>')
} catch (error) {
  if (error instanceof Xml.XmlError) {
    error.message // 'End tag "</a>" does not match start tag "<b>" (line 1, column 7)'
    error.offset  // 6
  }
}
```

# Supported XML

`parse` implements XML 1.0 (Fifth Edition) well-formedness for documents without DTD processing, plus Namespaces in XML 1.0:

- the XML declaration (`version`, `encoding`, `standalone` — validated, encoding is informational: input is already a string), comments, processing instructions;
- one document type declaration with an optional public/system identifier and internal subset — kept verbatim in the AST (`internalSubset`), never interpreted;
- elements, attributes (unique, no `<` in values, values normalized: literal white space becomes a space), empty-element tags, matched end tags, unbounded nesting (iterative, no recursion);
- character data with the five predefined entities (`&lt; &gt; &amp; &apos; &quot;`) and decimal/hexadecimal character references decoded; `]]>` rejected in text; adjacent character data forms one `Text` node; CDATA sections kept verbatim;
- Unicode names per the XML 1.0 `NameStartChar`/`NameChar` productions and the `Char` production for content (control characters and lone surrogates are rejected);
- line ends `\r\n` and `\r` normalized to `\n` before parsing;
- namespaces: `xmlns` and `xmlns:prefix` declarations scoped to their element, prefixes resolved into `Name.namespace` (the default namespace applies to unprefixed element names, not to attributes), `xml` bound to its namespace, `xmlns` reserved, undeclared prefixes and attributes that resolve to the same expanded name rejected.

## Not supported, by design

- **DTD processing.** Entity declarations, attribute defaults and validation are not applied. A reference to any entity other than the predefined five is an error (`Reference to undeclared entity "e"`), even when the internal subset declares it — use a character reference or CDATA instead. Consequently there is no entity expansion and no "billion laughs".
- **External resources.** Nothing is ever fetched: system identifiers and external entities are recorded as text at most. Parsing is linear in the input size.
- **XML 1.1**, which is accepted only as a version number.

`XmlError` is thrown at the first problem with `offset` (UTF-16 code units into the line-end normalized text), `line` and `column` (both one-based).

# AST

`Xml.Ast.Document = { type: 'Document', declaration?, prelude, root, epilogue }` where `prelude` holds comments, processing instructions and the doctype before the root and `epilogue` the comments and processing instructions after it. Element content (`items`) holds `Text`, `Cdata`, `Comment`, `ProcessingInstruction` and nested `Element` nodes; every `Name` is `{ prefix, local, namespace }`. `Xml.Name.string(name)` renders `prefix:local`, `Xml.Name.eq` compares names as written and `Xml.Name.same` compares expanded names.

`Xml.json(element, options)` produces `{ type, attributes | @-prefixed attributes, text, elements }` objects; `Xml.Json.attributes`, `Xml.Json.text` and `Xml.Json.property` are the pieces.

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
