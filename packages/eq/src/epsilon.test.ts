import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('epsilon equality is reflexive and inclusive', () => {
  assert.equal($.epsilon(0)(1, 1), true)
  assert.equal($.epsilon()(0.1 + 0.2, 0.3), true)
  assert.equal($.epsilon(0.5)(1, 1.5), true)
  assert.equal($.epsilon(0.5)(1, 1.6), false)
  assert.equal($.epsilon()(Infinity, Infinity), true)
})

await test('array equality does not skip holes', () => {
  const eq = $.array($.number)
  // eslint-disable-next-line no-sparse-arrays
  assert.equal(eq([ , 1 ] as number[], [ 2, 1 ]), false)
  assert.equal(eq([ 1, 2 ], [ 1, 2 ]), true)
  assert.equal(eq([ 1 ], [ 1, 2 ]), false)
})
