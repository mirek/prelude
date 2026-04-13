import * as Cmp from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('accent sensitivity', () => {
  const cmp = Cmp.locale(undefined, { sensitivity: 'accent' })
  assert.equal(cmp('a', 'a'), Cmp.eq)
  assert.equal(cmp('a', 'A'), Cmp.eq)
  assert.equal(cmp('a', 'á'), Cmp.asc)
})

await test('base sensitivity', () => {
  const cmp = Cmp.locale(undefined, { sensitivity: 'base' })
  assert.equal(cmp('a', 'a'), Cmp.eq)
  assert.equal(cmp('a', 'A'), Cmp.eq)
  assert.equal(cmp('a', 'á'), Cmp.eq)
  assert.equal(cmp('b', 'a'), Cmp.dsc)
})
