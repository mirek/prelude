import * as A from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('dot', () => {
  assert.equal(A.dot([ 1, 2, 3 ], [ 4, 5, 6 ]), 32)
  assert.equal(A.dot([ 1, 2, 3 ], [ 4, 5, 6, 7 ]), 32)
  assert.equal(A.dot([ 1, 2, 3, 4 ], [ 4, 5, 6 ]), 32)
  assert.equal(A.dot([ 1, 2, 3 ], [ 4, 5 ]), 14)
  assert.equal(A.dot([ 1, 2 ], [ 4, 5, 6 ]), 14)
  assert.equal(A.dot([ 1, 2 ], [ 4 ]), 4)
  assert.equal(A.dot([ 1 ], [ 4 ]), 4)
  assert.equal(A.dot([], []), 0)
})
