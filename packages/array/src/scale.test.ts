import * as A from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('scale', () => {
  assert.deepEqual(A.scale([ 7, 3, 5 ], 10), [ 70, 30, 50 ])
  assert.deepEqual(A.scale([ 7, 3, 5 ], 0.1), [ 0.7000000000000001, 0.30000000000000004, 0.5 ])
})
