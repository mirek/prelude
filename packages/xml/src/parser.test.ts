import * as P from '@prelude/parser'
import * as Xml from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('end', () => {
  assert.deepEqual(P.parse(Xml.Parser.endtag, '</root>'), 'root')
})

await test.skip('element', () => {
  assert.deepEqual(P.parse(Xml.Parser.element, '<foo/>'), {
    type: 'Element',
    name: 'foo',
    attributes: []
  })
  assert.deepEqual(P.parse(Xml.Parser.element, '<foo bar="baz"/>'), {
    type: 'element',
    name: 'foo',
    attributes: { bar: 'baz' },
    content: []
  })
  assert.deepEqual(P.parse(Xml.Parser.element, '<foo></foo>'), {
    type: 'element',
    name: 'foo',
    attributes: {},
    content: []
  })
  assert.deepEqual(P.parse(Xml.Parser.element, '<foo>bar</foo>'), {
    type: 'element',
    name: 'foo',
    attributes: {},
    content: [ { type: 'text', value: 'bar' } ]
  })
  assert.deepEqual(P.parse(Xml.Parser.element, '<foo><bar/></foo>'), {
    type: 'element',
    name: 'foo',
    attributes: {},
    content: [ { type: 'element', name: 'bar', attributes: {}, content: [] } ]
  })
  assert.deepEqual(P.parse(Xml.Parser.element, '<root>hello<foo />world</root>'), {
    type: 'element',
    name: 'root',
    attributes: {},
    content: [
      { type: 'text', value: 'hello' },
      { type: 'element', name: 'foo', attributes: {}, content: [] },
      { type: 'text', value: 'world' }
    ]
  })
  assert.deepEqual(P.parse(Xml.Parser.element, '<root>hello<foo />world<!--foo--><b>!</b></root>'), {
    type: 'Element',
    name: 'root',
    attributes: {},
    content: [
      { type: 'Text', value: 'hello' },
      { type: 'Element', name: 'foo', attributes: [], content: [] },
      { type: 'Text', value: 'world' },
      { type: 'Comment', value: 'foo' },
      { type: 'Element', name: 'b', attributes: [], content: [
        { type: 'Text', value: '!' }
      ] }
    ]
  })
})

await test('doctype', () => {
  // expect(P.parse(Xml.Parser.doctype, '<!DOCTYPE html>')).toEqual({
  //   type: 'Doctype',
  //   name: 'html'
  // })
  assert.deepEqual(P.parse(Xml.Parser.doctype, '<!DOCTYPE html [<!ENTITY foo "bar">]>'), {
    type: 'Doctype',
    value: ' html [<!ENTITY foo "bar">'
  })
  assert.deepEqual(P.parse(Xml.Parser.doctype, `<!DOCTYPE doc [
<!ELEMENT doc (#PCDATA)>
<!ENTITY e1 "&e2;">
<!ENTITY e2 "v">
]>`), {
    type: 'Doctype',
    value: ` doc [
<!ELEMENT doc (#PCDATA)>
<!ENTITY e1 "&e2;">
<!ENTITY e2 "v">
`
  })
})

await test('empty document', () => {
  assert.deepEqual(P.parse(Xml.Parser.document, '<root></root>'), {
    type: 'Document',
    prelude: [],
    root: {
      type: 'Element',
      name: 'root',
      attributes: [],
      items: []
    }
  })
})

await test('document with doctype', () => {
  assert.deepEqual(P.parse(Xml.Parser.document, '<!DOCTYPE doc [<!ELEMENT doc (#PCDATA)>]>\n<doc></doc>'), {
    type: 'Document',
    prelude: [
      {
        type: 'Doctype',
        value: ' doc [<!ELEMENT doc (#PCDATA)>'
      }
    ],
    root: {
      type: 'Element',
      name: 'doc',
      attributes: [],
      items: []
    }
  })
})
