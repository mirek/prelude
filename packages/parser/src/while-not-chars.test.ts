import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('whileNotChars', () => {
  const parser = P.parser(P.whileNotChars(' /<>', 1))
  assert.deepEqual(parser('foo'), 'foo')
})

await test('whileNotChars counts code points, not UTF-16 units, for min', () => {
  const parser = P.whileNotChars('|', 2)
  assert.equal(P.Result.failed(parser(P.Reader.of('😀|'))), true, 'one emoji is one character, not two')
  const result = parser(P.Reader.of('😀😀|')) as P.Result.Ok<string>
  assert.equal(result.value, '😀😀')
  assert.equal(result.reader.offset, 4)
})
