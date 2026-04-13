import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('lte', () => {
  assert.deepEqual($.lte(1)(0), $.ok(0))
  assert.deepEqual($.lte(1)(1), $.ok(1))
  assert.deepEqual($.lte(1)(2), $.fail(2, 'expected less than or equal to 1'))
})
