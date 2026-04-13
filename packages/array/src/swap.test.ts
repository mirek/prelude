import * as A from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('swap', () => {
  assert.deepEqual(A.swap([ 1, 2, 3 ], 0, 1), [ 2, 1, 3 ])
  assert.deepEqual(A.swap([ 1, 2, 3 ], 1, 2), [ 1, 3, 2 ])
  assert.deepEqual(A.swap([ 1, 2, 3 ], 0, 2), [ 3, 2, 1 ])
  assert.throws(() => A.swap([ 1, 2, 3 ], 3, 0))
  assert.throws(() => A.swap([ 1, 2, 3 ], -1, 0))
  assert.throws(() => A.swap([ 1, 2, 3 ], 0.5, 0))
  assert.throws(() => A.swap([ 1, 2, 3 ], 0, 3))
  assert.throws(() => A.swap([ 1, 2, 3 ], 0, -1))
  assert.throws(() => A.swap([ 1, 2, 3 ], 0, 0.5))
})
