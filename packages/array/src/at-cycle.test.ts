import * as A from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('atCycle', () => {
  assert.equal(A.atCycle([ 'a', 'b', 'c' ], 0), 'a')
  assert.equal(A.atCycle([ 'a', 'b', 'c' ], 3), 'a')
  assert.equal(A.atCycle([ 'a', 'b', 'c' ], -1), 'c')
})
