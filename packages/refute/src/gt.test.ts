import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('gt', () => {
  assert.deepEqual($.gt(1)(2), $.ok(2))
  assert.deepEqual($.gt(1)(1), $.fail(1, 'expected greater than 1'))
})
