import * as A from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('magnitude', () => {
  assert.equal(A.magnitude([]), 0)
  assert.equal(A.magnitude([ 3, 4 ]), 5)
})
