import * as A from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('maybeFirst', () => {
  assert.equal(A.maybeFirst([ 7, 3, 5 ]), 7)
  assert.equal(A.maybeFirst([]), undefined)
})
