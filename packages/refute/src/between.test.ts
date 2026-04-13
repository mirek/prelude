import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('between', () => {
  assert.deepEqual($.between(1, 3)(2), $.ok(2))
  assert.deepEqual($.between(1, 3)(1), $.ok(1))
  assert.deepEqual($.between(1, 3)(3), $.ok(3))
  assert.deepEqual($.between(1, 3)(0), $.fail(0, 'expected number between 1 and 3'))
})
