import * as Cmp from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('non-descending', () => {
  const f = Cmp.every(Cmp.nonDescending(Cmp.number))
  assert.equal(f([]), true)
  assert.equal(f([ 1 ]), true)
  assert.equal(f([ 1, 1 ]), true)
  assert.equal(f([ 1, 0, 2 ]), false)
})
