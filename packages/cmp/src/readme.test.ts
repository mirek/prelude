import * as C from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('Readme names match the exported API', () => {
  assert.equal(C.array(C.number)([ 1, 2 ], [ 1, 3 ]), C.asc)
  assert.equal(C.null(null, 1), C.asc)
  assert.equal(C.nullOr(C.number)(null, 1), C.asc)
  assert.equal(C.string('a', 'b'), C.asc)
  assert.equal(C.epsilon(0.1 + 0.2, 0.3), true)
  assert.equal(C.epsilon(0.1, 0.3), false)
  for (const stale of [ 'arrays', 'nulls', 'nullsOr', 'strings' ]) {
    assert.equal(stale in C, false, stale)
  }
})
