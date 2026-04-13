import * as A from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('at', () => {
  assert.equal(A.at([ 1, 2, 3 ], 0), 1)
  assert.equal(A.at([ 1, 2, 3 ], 1), 2)
  assert.equal(A.at([ 1, 2, 3 ], 2), 3)
  assert.throws(() => A.at([ 1, 2, 3 ], 3))
  assert.throws(() => A.at([ 1, 2, 3 ], -1))
  assert.throws(() => A.at([ 1, 2, 3 ], 0.5))
})
