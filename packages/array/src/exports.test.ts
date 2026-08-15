import * as A from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('empty is exported from the package index', () => {
  assert.equal(A.empty([]), true)
  assert.equal(A.empty([ 1 ]), false)
})
