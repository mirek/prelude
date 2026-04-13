import * as Cmp from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('sign', () => {
  assert.equal(Cmp.sign(Infinity), 1)
  assert.equal(Cmp.sign(42), 1)
  assert.equal(Cmp.sign(Number.EPSILON), 1)
  assert.equal(Cmp.sign(0), 0)
  assert.equal(Cmp.sign(-Number.EPSILON), -1)
  assert.equal(Cmp.sign(-42), -1)
  assert.equal(Cmp.sign(-Infinity), -1)
  assert.throws(() => Cmp.sign(NaN))
})
