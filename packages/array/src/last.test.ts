import * as A from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('last', () => {
  assert.equal(A.last([ 7, 3, 5 ]), 5)
  assert.throws(() => A.last([]))
})
