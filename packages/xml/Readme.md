# Xml

XML parser built on `@prelude/parser`. `parse` turns a document into a small tagged AST (`Document`, `Element`, `Attribute`, `Text`, `Cdata`, `Comment`, `ProcessingInstruction`, `Doctype`); `json` converts the AST into plain objects.

# Usage

```bash
npm i -E @prelude/xml
```

```ts
import * as Xml from '@prelude/xml'

const document = Xml.parse('<note id="1"><to>Ada</to></note>')
// document.root: { type: 'Element', name: 'note', attributes: [{ type: 'Attribute', name: 'id', value: '1' }], items: [...] }
```

The individual grammar rules are exported as `Xml.Parser.*` for embedding in larger parsers, and the AST types as `Xml.Ast.*`.

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
