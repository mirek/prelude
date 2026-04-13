import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('gte', () => {
  assert.deepEqual($.gte(1)(2), $.ok(2))
  assert.deepEqual($.gte(1)(1), $.ok(1))
  assert.deepEqual($.gte(1)(0), $.fail(0, 'expected greater than or equal to 1'))
})
