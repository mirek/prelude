import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('any', () => {
  const p = P.parser(
    P.map(P.seq('[', P.any, ']'), _ => _[1])
  )
  assert.deepEqual(p('[a]'), 'a')
  assert.throws(() => p('[]'), /Failed sequence\. Expected \]\./)
  assert.throws(() => p('[  ]'), /Failed sequence\. Expected \]\./)
})
