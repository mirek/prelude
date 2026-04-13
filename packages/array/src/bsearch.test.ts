import * as A from './index.js'
import * as Cmp from '@prelude/cmp'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const cmpWith =
  (value: number) =>
    (a: number) =>
      Cmp.number(a, value)

await test('bsearch', () => {
  assert.equal(A.bsearch([ 1, 2, 3 ], cmpWith(1)), 0)
  assert.equal(A.bsearch([ 1, 2, 3 ], cmpWith(2)), 1)
  assert.equal(A.bsearch([ 1, 2, 3 ], cmpWith(3)), 2)
  assert.equal(A.bsearch([ 1, 2, 3 ], cmpWith(0)), -1)
  assert.equal(A.bsearch([ 1, 2, 3 ], cmpWith(4)), -4)
  assert.equal(A.bsearch([ 1, 2, 3 ], cmpWith(1.5)), -2)
})
