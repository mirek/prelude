import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('finite', () => {
  assert.deepEqual($.finite(1), $.ok(1))
  assert.deepEqual($.finite(Infinity), $.fail(Infinity, 'expected finite number'))
  assert.deepEqual($.finite(NaN), $.fail(NaN, 'expected finite number'))
})
