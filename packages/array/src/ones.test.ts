import * as A from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('ones', () => {
  assert.deepEqual(A.ones(3), [ 1, 1, 1 ])
})
