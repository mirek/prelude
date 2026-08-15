import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('until', () => {
  const p = P.parser(P.until('END'))
  assert.deepEqual(p('END'), { head: '', tail: 'END' })
  assert.deepEqual(p('foo END'), { head: 'foo ', tail: 'END' })
  assert.throws(() => p('foo END bar'), new RegExp(String.raw`Expected exhaustive result, parsed 7 \(unparsed 4\)\.\n\nfoo END bar\n       \^ 1:8`))
})

await test('until and next can match at the end of input', () => {
  assert.deepEqual(P.parse(P.until(P.end), 'abc'), { head: 'abc', tail: null })
  assert.deepEqual(P.parse(P.until(P.end), ''), { head: '', tail: null })
  assert.deepEqual(P.parse(P.next(P.end), 'abc'), null)
  assert.equal(P.Result.failed(P.until('x')(P.Reader.of('abc'))), true)
})
