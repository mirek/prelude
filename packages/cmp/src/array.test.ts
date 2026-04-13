import * as Cmp from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('same', () => {
  assert.equal(Cmp.array(Cmp.number)(
    [ 3, 5, 4 ],
    [ 3, 5, 4 ]
  ), Cmp.eq)
})

await test('asc', () => {
  assert.equal(Cmp.array(Cmp.number)(
    [ 3, 5, 4 ],
    [ 3, 6, 4 ]
  ), Cmp.asc)
  assert.equal(Cmp.array(Cmp.number)(
    [ 3, 5, 4 ],
    [ 3, 5, 4, 1 ]
  ), Cmp.asc)
})

await test('dsc', () => {
  assert.equal(Cmp.array(Cmp.number)(
    [ 3, 6, 4 ],
    [ 3, 5, 4 ]
  ), Cmp.dsc)
  assert.equal(Cmp.array(Cmp.number)(
    [ 3, 5, 4, 1 ],
    [ 3, 5, 4 ]
  ), Cmp.dsc)
})
