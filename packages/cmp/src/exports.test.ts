import * as C from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('kindof and partialB are exported from the package index', () => {
  assert.equal(C.kindof(1n), 'bigint')
  assert.equal(C.kindof(NaN), 'NaN')
  assert.equal(C.rank.undefined, 0)
  const atLeastFive = C.partialB<number>(C.number, 5)
  assert.equal(atLeastFive(7), C.dsc)
  assert.equal(atLeastFive(5), C.eq)
  assert.equal(atLeastFive(3), C.asc)
})
