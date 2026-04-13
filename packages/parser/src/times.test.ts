import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('times', () => {
  const q = P.times(3, 'a')
  const p = P.parser(q)
  const r: 'a'[] = p('aaa')
  assert.deepEqual(r, [ 'a', 'a', 'a' ])
})
