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

await test('randomIndex rejects non-finite lengths and atClamp rejects empty arrays clearly', () => {
  assert.throws(() => A.randomIndex(NaN), /random index/)
  assert.throws(() => A.randomIndex(Infinity), /random index/)
  assert.throws(() => A.randomIndex(0), /random index/)
  const index = A.randomIndex(3)
  assert.ok(Number.isInteger(index) && index >= 0 && index < 3)
  assert.throws(() => A.atClamp([], 0), /non empty/)
})
