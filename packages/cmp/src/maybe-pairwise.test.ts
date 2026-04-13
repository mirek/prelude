import * as Cmp from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('maybePairwise', () => {
  const xs = [ 1, 2, 3 ]
  const cmp = Cmp.maybePairwise(Cmp.number)
  assert.equal(cmp(xs, [ 1, 2, 3 ]), Cmp.eq)
  assert.equal(cmp(xs, [ 1, 2, 4 ]), Cmp.asc)
  assert.equal(cmp(xs, [ 1, 2, 2 ]), Cmp.dsc)
  assert.equal(cmp(xs, [ 1, 2, 3, 4 ]), Cmp.asc)
  assert.equal(cmp(xs, [ 1, 2 ]), Cmp.dsc)
})
