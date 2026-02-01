import { test, expect } from '@jest/globals'
import * as P from '@prelude/parser'
import * as Xml from './index.js'

test('end', () => {
  expect(P.parse(Xml.Parser.endtag, '</root>')).toEqual('root')
})

test.skip('element', () => {
  expect(P.parse(Xml.Parser.element, '<foo/>')).toEqual({
    type: 'Element',
    name: 'foo',
    attributes: []
  })
  expect(P.parse(Xml.Parser.element, '<foo bar="baz"/>')).toEqual({
    type: 'element',
    name: 'foo',
    attributes: { bar: 'baz' },
    content: []
  })
  expect(P.parse(Xml.Parser.element, '<foo></foo>')).toEqual({
    type: 'element',
    name: 'foo',
    attributes: {},
    content: []
  })
  expect(P.parse(Xml.Parser.element, '<foo>bar</foo>')).toEqual({
    type: 'element',
    name: 'foo',
    attributes: {},
    content: [ { type: 'text', value: 'bar' } ]
  })
  expect(P.parse(Xml.Parser.element, '<foo><bar/></foo>')).toEqual({
    type: 'element',
    name: 'foo',
    attributes: {},
    content: [ { type: 'element', name: 'bar', attributes: {}, content: [] } ]
  })
  expect(P.parse(Xml.Parser.element, '<root>hello<foo />world</root>')).toEqual({
    type: 'element',
    name: 'root',
    attributes: {},
    content: [
      { type: 'text', value: 'hello' },
      { type: 'element', name: 'foo', attributes: {}, content: [] },
      { type: 'text', value: 'world' }
    ]
  })
  expect(P.parse(Xml.Parser.element, '<root>hello<foo />world<!--foo--><b>!</b></root>')).toEqual({
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

test('doctype', () => {
  // expect(P.parse(Xml.Parser.doctype, '<!DOCTYPE html>')).toEqual({
  //   type: 'Doctype',
  //   name: 'html'
  // })
  expect(P.parse(Xml.Parser.doctype, '<!DOCTYPE html [<!ENTITY foo "bar">]>')).toEqual({
    type: 'Doctype',
    value: ' html [<!ENTITY foo "bar">'
  })
  expect(P.parse(Xml.Parser.doctype, `<!DOCTYPE doc [
<!ELEMENT doc (#PCDATA)>
<!ENTITY e1 "&e2;">
<!ENTITY e2 "v">
]>`)).toEqual({
    type: 'Doctype',
    value: ` doc [
<!ELEMENT doc (#PCDATA)>
<!ENTITY e1 "&e2;">
<!ENTITY e2 "v">
`
  })
})

test('empty document', () => {
  expect(P.parse(Xml.Parser.document, '<root></root>')).toEqual({
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

test('document with doctype', () => {
  expect(P.parse(Xml.Parser.document, '<!DOCTYPE doc [<!ELEMENT doc (#PCDATA)>]>\n<doc></doc>')).toEqual({
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
