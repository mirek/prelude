import * as A from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('first', () => {
  assert.equal(A.first([ 7, 3, 5 ]), 7)
  assert.throws(() => A.first([]))
})
