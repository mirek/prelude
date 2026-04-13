import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('bigint', () => {
  assert.deepEqual($.bigint(0n), $.ok(0n))
  assert.deepEqual($.bigint(1), $.fail(1, 'expected bigint'))
})
