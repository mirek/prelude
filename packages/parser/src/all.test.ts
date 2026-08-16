import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('all', () => {
  const p = P.parser(P.all(P.re(/\d+/)))
  assert.deepEqual(p('foo 123 bar 456 baz'), [ '123', '456' ])
})

await test('all terminates on parsers that can match zero width', () => {
  // Every offset up to and including the end of input is tried.
  assert.deepEqual(P.all(P.maybe('a'))(P.Reader.of('bbb')).value, [ undefined, undefined, undefined, undefined ])
  assert.deepEqual(P.all(P.ws0)(P.Reader.of('a b')).value, [ '', ' ', '', '' ])
  assert.deepEqual(P.all(P.re(/x*/))(P.Reader.of('xxab')).value, [ 'xx', '', '', '' ])
})

await test('all tries end of input uniformly', () => {
  assert.deepEqual(P.all(P.end)(P.Reader.of('')).value, [ null ])
  assert.deepEqual(P.all(P.end)(P.Reader.of('x')).value, [ null ])
  assert.deepEqual(P.all(P.eol)(P.Reader.of('')).value, [ '' ])
  assert.deepEqual(P.all(P.eol)(P.Reader.of('x')).value, [ '' ])
  assert.deepEqual(P.all(P.eol)(P.Reader.of('a\nb')).value, [ '\n', '' ])
})

await test('all advances from the located zero-width match', () => {
  assert.deepEqual(P.all(P.bol)(P.Reader.of('x\ny')).value, [ '', '' ])
  assert.deepEqual(P.all(P.bol)(P.Reader.of('ab\ncd\nef')).value, [ '', '', '' ])
})

await test('all fully consumes the reader', () => {
  const result = P.all(P.bol)(P.Reader.of('x\ny'))
  assert.deepEqual(result.reader, { input: 'x\ny', offset: 3 })
})
