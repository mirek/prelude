import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('lt', () => {
  assert.deepEqual($.lt(1)(0), $.ok(0))
  assert.deepEqual($.lt(1)(1), $.fail(1, 'expected less than 1'))
})
