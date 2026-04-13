import * as A from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('sum', () => {
  assert.equal(A.sum([]), 0)
  assert.equal(A.sum([ 1, 2, 3 ]), 6)
})
