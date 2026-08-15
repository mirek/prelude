import * as S from './index.js'
import * as Lines from './lines.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('lines split on CRLF as well as LF', () => {
  assert.deepEqual(Lines.of('a\r\nb\r\n'), [ 'a', 'b', '' ])
  assert.deepEqual(Lines.of('a\nb\n'), [ 'a', 'b', '' ])
  assert.deepEqual(Lines.of('a\r\nb\nc'), [ 'a', 'b', 'c' ])
})

await test('dedent handles CRLF input', () => {
  assert.equal(S.dedent('\r\n  a\r\n  b\r\n'), 'a\nb')
})

await test('indent and indentTail keep CRLF line endings', () => {
  assert.equal(S.indent('a\r\nb'), '  a\r\n  b')
  assert.equal(S.indentTail('a\r\nb'), 'a\r\n  b')
  assert.equal(S.indent('a\nb'), '  a\n  b')
  assert.equal(S.indentTail('a\nb'), 'a\n  b')
})
