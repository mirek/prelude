import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('all', () => {
  const p = P.parser(P.all(P.re(/\d+/)))
  assert.deepEqual(p('foo 123 bar 456 baz'), [ '123', '456' ])
})

await test('all terminates on parsers that can match zero width', () => {
  assert.deepEqual(P.all(P.maybe('a'))(P.Reader.of('bbb')).value, [ undefined, undefined, undefined ])
  assert.deepEqual(P.all(P.ws0)(P.Reader.of('a b')).value, [ '', ' ', '' ])
  assert.deepEqual(P.all(P.re(/x*/))(P.Reader.of('xxab')).value, [ 'xx', '', '' ])
})
