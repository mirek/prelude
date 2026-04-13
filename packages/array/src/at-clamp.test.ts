import * as A from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('atClamp', () => {
  assert.equal(A.atClamp([ 'a', 'b', 'c' ], 0), 'a')
  assert.equal(A.atClamp([ 'a', 'b', 'c' ], 3), 'c')
  assert.equal(A.atClamp([ 'a', 'b', 'c' ], -1), 'a')
})
