import * as A from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('maybeLast', () => {
  assert.equal(A.maybeLast([ 7, 3, 5 ]), 5)
  assert.equal(A.maybeLast([]), undefined)
})
