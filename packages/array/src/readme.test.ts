import * as A from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('Readme names match the exported API', () => {
  assert.equal(A.atClamp([ 1, 2, 3 ], -1), 1)
  assert.equal(A.atClamp([ 1, 2, 3 ], 9), 3)
  assert.equal(A.atCycle([ 1, 2, 3 ], 4), 2)
  assert.equal(A.atCycle([ 1, 2, 3 ], -1), 3)
  for (const stale of [ 'bounded', 'modulo' ]) {
    assert.equal(stale in A, false, stale)
  }
})
