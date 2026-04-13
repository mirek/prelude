import * as Cmp from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('length', () => {
  const a = [ 1, 2, 3 ]
  const b = [ 1, 2 ]
  assert.equal(Cmp.length(a, b), Cmp.dsc)
  assert.equal(Cmp.length(b, a), Cmp.asc)
})

await test('equal', () => {
  const a = [ 1, 2, 3 ]
  const b = [ 1, 2, 3 ]
  assert.equal(Cmp.length(a, b), Cmp.eq)
  assert.equal(Cmp.length(b, a), Cmp.eq)
})
