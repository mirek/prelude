import * as Xml from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const n = Xml.Name.of
const text = (value: string): Xml.Ast.Text => ({ type: 'Text', value })
const element = (name: Xml.Ast.Name, attributes: Xml.Ast.Attribute[] = [], items: Xml.Ast.Item[] = []): Xml.Ast.Element =>
  ({ type: 'Element', name, attributes, items })
const attribute = (name: Xml.Ast.Name, value: string): Xml.Ast.Attribute => ({ type: 'Attribute', name, value })

/** Asserts `input` fails with an XmlError carrying `message` at `line`:`column`. */
const rejects =
  (input: string, message: RegExp, line: number, column: number) => {
    assert.throws(() => Xml.parse(input), (error: unknown) => {
      assert.ok(error instanceof Xml.XmlError, `expected XmlError, got ${String(error)}`)
      assert.match(error.message, message)
      assert.equal(`${error.line}:${error.column}`, `${line}:${column}`, `location of: ${error.message}`)
      assert.equal(error.offset, offsetOf(input.replace(/\r\n?/g, '\n'), line, column))
      return true
    })
  }

const offsetOf =
  (input: string, line: number, column: number) => {
    let offset = 0
    for (let i = 1; i < line; i++) {
      offset = input.indexOf('\n', offset) + 1
    }
    return offset + column - 1
  }

await test('elements, attributes and mixed content', () => {
  const document = Xml.parse('<root a="1" b=\'2\'>hi<foo />yo<!--c--><b>!</b></root>')
  assert.deepEqual(document, {
    type: 'Document',
    declaration: undefined,
    prelude: [],
    root: element(n('root'), [ attribute(n('a'), '1'), attribute(n('b'), '2') ], [
      text('hi'),
      element(n('foo')),
      text('yo'),
      { type: 'Comment', value: 'c' },
      element(n('b'), [], [ text('!') ])
    ]),
    epilogue: []
  })
  assert.deepEqual(Xml.parse('<a/>').root, element(n('a')))
  assert.deepEqual(Xml.parse('<a></a>').root, element(n('a')))
  assert.deepEqual(Xml.parse('<a\n  x = "1"\n/>').root, element(n('a'), [ attribute(n('x'), '1') ]))
  assert.deepEqual(Xml.parse('<a>  </a>').root, element(n('a'), [], [ text('  ') ]))
})

await test('the XML declaration, doctypes, comments and processing instructions around the root', () => {
  const document = Xml.parse('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<!-- top -->\n<?pi some data?>\n<!DOCTYPE html>\n<html/>\n<!-- end --><?after?>\n')
  assert.deepEqual(document.declaration, { type: 'Declaration', version: '1.0', encoding: 'UTF-8', standalone: true })
  assert.deepEqual(document.prelude, [
    { type: 'Comment', value: ' top ' },
    { type: 'ProcessingInstruction', target: 'pi', value: 'some data' },
    { type: 'Doctype', name: 'html', publicId: undefined, systemId: undefined, internalSubset: undefined }
  ])
  assert.deepEqual(document.root, element(n('html')))
  assert.deepEqual(document.epilogue, [ { type: 'Comment', value: ' end ' }, { type: 'ProcessingInstruction', target: 'after', value: '' } ])
  assert.deepEqual(Xml.parse('<?xml version="1.1"?><a/>').declaration, { type: 'Declaration', version: '1.1', encoding: undefined, standalone: undefined })
})

await test('doctypes with external identifiers and an internal subset that is kept verbatim', () => {
  const external = Xml.parse('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1.dtd"><html/>').prelude[0]
  assert.deepEqual(external, { type: 'Doctype', name: 'html', publicId: '-//W3C//DTD XHTML 1.0//EN', systemId: 'http://www.w3.org/TR/xhtml1/DTD/xhtml1.dtd', internalSubset: undefined })
  const system = Xml.parse('<!DOCTYPE note SYSTEM \'note.dtd\'><note/>').prelude[0]
  assert.deepEqual(system, { type: 'Doctype', name: 'note', publicId: undefined, systemId: 'note.dtd', internalSubset: undefined })
  const subset = '<!ELEMENT note (#PCDATA)>\n<!ATTLIST note id ID #IMPLIED>\n<!ENTITY tricky "]>"> <!ENTITY % pe SYSTEM "x.ent"> %pe; <!NOTATION n PUBLIC "p"> <!-- ] --> <?pi ] ?>\n'
  const internal = Xml.parse(`<!DOCTYPE note [${subset}]>\n<note/>`).prelude[0]
  assert.deepEqual(internal, { type: 'Doctype', name: 'note', publicId: undefined, systemId: undefined, internalSubset: subset })
  // Declared entities are not applied: the internal subset is data, not instructions.
  rejects('<!DOCTYPE a [<!ENTITY e "x">]><a>&e;</a>', /undeclared entity "e"/, 1, 34)
})

await test('character and entity references are decoded in text and attribute values', () => {
  const root = Xml.parse('<a x="&lt;&#65;&#x42;&quot;&apos;&amp;">1 &lt; 2 &amp;&amp; &#x1F600; &#8364;&gt;</a>').root
  assert.deepEqual(root.attributes, [ attribute(n('x'), '<AB"\'&') ])
  assert.deepEqual(root.items, [ text('1 < 2 && 😀 €>') ])
  assert.deepEqual(Xml.parse('<a>&#10;&#9;</a>').root.items, [ text('\n\t') ])
})

await test('attribute values are normalized: literal white space becomes a space, references are kept as written', () => {
  const root = Xml.parse('<a x=" a\n\tb  c " y="&#10;&#x9;"/>').root
  assert.deepEqual(root.attributes, [ attribute(n('x'), ' a  b  c '), attribute(n('y'), '\n\t') ])
})

await test('CDATA sections and comments keep their content verbatim; adjacent character data is one text node', () => {
  const root = Xml.parse('<a>x<![CDATA[<b>&amp;]]&gt;]]>y<!-- <c> - not really --></a>').root
  assert.deepEqual(root.items, [
    text('x'),
    { type: 'Cdata', value: '<b>&amp;]]&gt;' },
    text('y'),
    { type: 'Comment', value: ' <c> - not really ' }
  ])
  assert.deepEqual(Xml.parse('<a>1&amp;2<b/>3</a>').root.items, [ text('1&2'), element(n('b')), text('3') ])
})

await test('line ends are normalized to \\n in text, attributes and errors', () => {
  const root = Xml.parse('<a x="1\r\n2">l1\r\nl2\rl3</a>').root
  assert.deepEqual(root.attributes, [ attribute(n('x'), '1 2') ])
  assert.deepEqual(root.items, [ text('l1\nl2\nl3') ])
  rejects('<a>\r\n<b>\r</a>', /End tag "<\/a>" does not match start tag "<b>"/, 3, 1)
})

await test('Unicode names and characters', () => {
  const root = Xml.parse('<données π="3" 名前="x"><日本語>ünïcødé 𝒳</日本語><_a.b-c1/></données>').root
  assert.equal(root.name.local, 'données')
  assert.deepEqual(root.attributes.map(a => a.name.local), [ 'π', '名前' ])
  assert.deepEqual(root.items, [ element(n('日本語'), [], [ text('ünïcødé 𝒳') ]), element(n('_a.b-c1')) ])
  rejects('<1a/>', /Expected an element name/, 1, 2)
  rejects('<a -b="1"/>', /Expected an attribute name/, 1, 4)
  rejects('<a><.b/></a>', /Expected an element name/, 1, 5)
})

await test('namespaces are resolved and scoped', () => {
  const root = Xml.parse('<r xmlns="urn:d" xmlns:p="urn:p" p:a="1" b="2"><p:c xmlns="urn:e" xmlns:q="urn:q"><d q:x="y"/></p:c><e xmlns=""/></r>').root
  assert.deepEqual(root.name, n('r', '', 'urn:d'))
  assert.deepEqual(root.attributes, [
    attribute(n('xmlns', '', 'http://www.w3.org/2000/xmlns/'), 'urn:d'),
    attribute(n('p', 'xmlns', 'http://www.w3.org/2000/xmlns/'), 'urn:p'),
    attribute(n('a', 'p', 'urn:p'), '1'),
    attribute(n('b'), '2')
  ])
  const [ c, e ] = root.items as Xml.Ast.Element[]
  assert.deepEqual(c.name, n('c', 'p', 'urn:p'))
  const [ d ] = c.items as Xml.Ast.Element[]
  assert.deepEqual(d.name, n('d', '', 'urn:e'))
  assert.deepEqual(d.attributes, [ attribute(n('x', 'q', 'urn:q'), 'y') ])
  assert.deepEqual(e.name, n('e', '', undefined))
  // xml: is always bound.
  assert.deepEqual(Xml.parse('<a xml:lang="en"/>').root.attributes, [ attribute(n('lang', 'xml', 'http://www.w3.org/XML/1998/namespace'), 'en') ])
  // Name helpers.
  assert.equal(Xml.Name.string(c.name), 'p:c')
  assert.equal(Xml.Name.string(c.name, { format: 'local', prefix: '@' }), '@c')
  assert.equal(Xml.Name.eq(n('c', 'p', 'urn:p'), n('c', 'p', 'urn:x')), true)
  assert.equal(Xml.Name.same(n('c', 'p', 'urn:p'), n('c', 'q', 'urn:p')), true)
  assert.equal(Xml.Name.same(n('c', 'p', 'urn:p'), n('c', 'p', 'urn:x')), false)
})

await test('namespace errors', () => {
  rejects('<p:a/>', /Undeclared namespace prefix "p" in "p:a"/, 1, 2)
  rejects('<a p:x="1"/>', /Undeclared namespace prefix "p" in "p:x"/, 1, 4)
  rejects('<a:b:c/>', /Unexpected ":" in name "a:b"/, 1, 5)
  rejects('<a:/>', /Expected local name after "a:"/, 1, 4)
  rejects('<:a/>', /Expected an element name/, 1, 2)
  rejects('<a xmlns:xmlns="urn:x"/>', /"xmlns" cannot be declared/, 1, 4)
  rejects('<a xmlns:xml="urn:x"/>', /"xml" is bound to/, 1, 4)
  rejects('<a xmlns:y="http://www.w3.org/XML/1998/namespace"/>', /Only the prefix "xml"/, 1, 4)
  rejects('<a xmlns:p=""/>', /cannot be bound to an empty namespace name/, 1, 4)
  rejects('<a xmlns:p="urn:x" xmlns:q="urn:x" p:x="1" q:x="2"/>', /both resolve to \{urn:x\}x/, 1, 44)
})

await test('deeply nested documents do not overflow the stack', () => {
  const depth = 100_000
  const document = Xml.parse(`${'<a>'.repeat(depth)}x${'</a>'.repeat(depth)}`)
  let element = document.root
  for (let i = 1; i < depth; i++) {
    element = element.items[0] as Xml.Ast.Element
  }
  assert.deepEqual(element.items, [ text('x') ])
})

await test('malformed markup fails at a stable location', () => {
  rejects('', /Expected root element/, 1, 1)
  rejects('   ', /Expected root element/, 1, 4)
  rejects('hello', /Character data outside the root element/, 1, 1)
  rejects('<a>', /Unterminated element "a"/, 1, 4)
  rejects('<a><b></a>', /End tag "<\/a>" does not match start tag "<b>"/, 1, 7)
  rejects('<a></b>', /End tag "<\/b>" does not match start tag "<a>"/, 1, 4)
  rejects('<a/>garbage', /Character data after the root element/, 1, 5)
  rejects('<a/><b/>', /Only one root element/, 1, 5)
  rejects('<a/>&amp;', /Character data after the root element/, 1, 5)
  rejects('<a x="1" x="2"/>', /Duplicate attribute "x"/, 1, 10)
  rejects('<a x="1"y="2"/>', /Expected whitespace, ">" or "\/>" after "x"/, 1, 9)
  rejects('<a x=1/>', /Expected a quoted value in attribute "x"/, 1, 6)
  rejects('<a x="1<2"/>', /"<" is not allowed in the value of attribute "x"/, 1, 8)
  rejects('<a x="1', /Unterminated value of attribute "x"/, 1, 6)
  rejects('<a x/>', /Expected "=" after attribute name "x"/, 1, 5)
  rejects('<a', /Unterminated start tag "<a"/, 1, 1)
  rejects('<a>]]></a>', /"\]\]>" is not allowed in character data/, 1, 4)
  rejects('<a>&foo;</a>', /undeclared entity "foo"/, 1, 4)
  rejects('<a>&amp</a>', /Expected ";" after entity name "amp"/, 1, 4)
  rejects('<a>& b</a>', /Expected entity name after "&"/, 1, 4)
  rejects('<a>&#;</a>', /Expected digits in character reference/, 1, 4)
  rejects('<a>&#xZ;</a>', /Expected hexadecimal digits/, 1, 4)
  rejects('<a>&#0;</a>', /invalid character \(&#0;\)/, 1, 4)
  rejects('<a>&#xD800;</a>', /invalid character/, 1, 4)
  rejects('<a>\u0001</a>', /Invalid character U\+0001/, 1, 4)
  rejects('<a x="\u0007"/>', /Invalid character U\+0007/, 1, 7)
  rejects('<a><!-- a -- b --></a>', /"--" is not allowed inside a comment/, 1, 11)
  rejects('<a><!--x---></a>', /cannot end with "-"/, 1, 9)
  rejects('<a><!-- x</a>', /Unterminated comment/, 1, 4)
  rejects('<a><![CDATA[x</a>', /Unterminated CDATA section/, 1, 4)
  rejects('<a><!ELEMENT a ANY></a>', /Expected a comment or CDATA section after "<!"/, 1, 4)
  rejects('<a><!DOCTYPE a></a>', /only allowed before the root element/, 1, 4)
  rejects('<a><?xml version="1.0"?></a>', /target "xml" is reserved/, 1, 4)
  rejects('<a><?XML x?></a>', /target "xml" is reserved/, 1, 4)
  rejects('<a><?pi:x d?></a>', /cannot contain ":"/, 1, 8)
  rejects('<a><?pi</a>', /Expected whitespace before processing instruction data/, 1, 8)
  rejects('<a><?pi x</a>', /Unterminated processing instruction/, 1, 4)
  rejects('<a><? x?></a>', /Expected a processing instruction target/, 1, 6)
})

await test('malformed prolog fails at a stable location', () => {
  rejects(' <?xml version="1.0"?><a/>', /must be at the very start/, 1, 2)
  rejects('<?xml?><a/>', /must start with version/, 1, 1)
  rejects('<?xml encoding="UTF-8"?><a/>', /must start with version/, 1, 1)
  rejects('<?xml version="1.0" standalone="yes" encoding="UTF-8"?><a/>', /must order version, encoding, standalone/, 1, 1)
  rejects('<?xml version="2.0"?><a/>', /Unsupported XML version "2.0"/, 1, 1)
  rejects('<?xml version="1.0" foo="bar"?><a/>', /Unexpected "foo"/, 1, 1)
  rejects('<?xml version="1.0" standalone="maybe"?><a/>', /standalone to be "yes" or "no"/, 1, 1)
  rejects('<?xml version="1.0" encoding="8bit"?><a/>', /Invalid encoding name "8bit"/, 1, 1)
  rejects('<?xml version="1.0"?', /Unterminated XML declaration/, 1, 1)
  rejects('<?xml version="1.0"?><!DOCTYPE a><!DOCTYPE a><a/>', /Only one document type declaration/, 1, 34)
  rejects('<!DOCTYPE><a/>', /Expected whitespace before the document type name/, 1, 10)
  rejects('<!DOCTYPE a [<!ELEMENT a ANY>', /Unterminated internal subset/, 1, 1)
  rejects('<!DOCTYPE a [<!ENTITY e "unterminated ]><a/>', /Unterminated literal in the ENTITY declaration/, 1, 25)
  rejects('<!DOCTYPE a [garbage]><a/>', /Expected a markup declaration/, 1, 14)
  rejects('<!DOCTYPE a [<!FOO x>]><a/>', /Expected ELEMENT, ATTLIST, ENTITY or NOTATION/, 1, 14)
  rejects('<!DOCTYPE a [<!ELEMENT a (#PCDATA)]><a/>', /Unterminated ELEMENT declaration/, 1, 14)
  rejects('<!DOCTYPE a [<!ELEMENT a <b>>]><a/>', /"<" is not allowed inside the ELEMENT declaration/, 1, 26)
  rejects('<!DOCTYPE a [%pe]><a/>', /Expected ";" after the parameter entity name/, 1, 14)
  rejects('<!DOCTYPE a SYSTEM "a.dtd#x"><a/>', /cannot contain a fragment identifier/, 1, 26)
  rejects('<!DOCTYPE a PUBLIC "x"><a/>', /Expected whitespace before the system identifier/, 1, 23)
  rejects('<!DOCTYPE a PUBLIC "é" "x"><a/>', /Invalid character in the public identifier/, 1, 20)
  rejects('<!DOCTYPE a SYSTEM x><a/>', /Expected a quoted value in the system identifier/, 1, 20)
  rejects('<!DOCTYPE a x><a/>', /Expected ">" to end the document type declaration/, 1, 13)
  rejects('<!-- --><!DOCTYPE a><?xml version="1.0"?><a/>', /target "xml" is reserved/, 1, 21)
  rejects('<a/><!DOCTYPE a>', /Only one root element/, 1, 5)
})
