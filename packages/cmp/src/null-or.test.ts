import * as Cmp from './index.js'
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

await describe('nullable numbers', async () => {

  const cmp = Cmp.array(Cmp.nullOr(Cmp.number))

  await test('empty', () => {
    assert.equal(cmp([], []), Cmp.eq)
  })

  await test('equal', () => {
    assert.equal(cmp(
      [ 5, 3, 4 ],
      [ 5, 3, 4 ]
    ), Cmp.eq)
  })

  await test('nullable ascending', () => {
    assert.equal(cmp(
      [ 5, null, 4 ],
      [ 5, 3, 4 ]
    ), Cmp.asc)
  })

  await test('equal nulls', () => {
    assert.equal(cmp(
      [ null ],
      [ null ]
    ), Cmp.eq)
  })

  await test('ascending nulls', () => {
    assert.equal(cmp(
      [ null ],
      [ null, null ]
    ), Cmp.asc)
  })

})
