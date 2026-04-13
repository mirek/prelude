import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('until', () => {
  const p = P.parser(P.until('END'))
  assert.deepEqual(p('END'), { head: '', tail: 'END' })
  assert.deepEqual(p('foo END'), { head: 'foo ', tail: 'END' })
  assert.throws(() => p('foo END bar'), new RegExp(String.raw`Expected exhaustive result, parsed 7 \(unparsed 4\)\.\n\nfoo END bar\n       \^ 1:8`))
})
