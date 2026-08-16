import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('whileChars', () => {
  const parser = P.parser(P.whileChars('0123456789', 1))
  assert.deepEqual(parser('42'), '42')
})

await test('whileChars counts code points, not UTF-16 units, for min', () => {
  const parser = P.whileChars('😀', 2)
  assert.equal(P.Result.failed(parser(P.Reader.of('😀'))), true, 'one emoji is one character, not two')
  const result = parser(P.Reader.of('😀😀')) as P.Result.Ok<string>
  assert.equal(result.value, '😀😀')
  assert.equal(result.reader.offset, 4)
})
