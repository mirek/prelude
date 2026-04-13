import * as A from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('shuffle', () => {
  const xs = A.sort(A.randoms(100), A.Cmp.number)
  const before = A.clone(xs)
  const ys = A.shuffle(xs)
  assert.notDeepEqual(ys, before)
  A.sort(ys, A.Cmp.number)
  assert.deepEqual(ys, before)
})
