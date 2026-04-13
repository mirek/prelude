import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('false', () => {
  assert.deepEqual($.false(false), $.ok(false))
  assert.deepEqual($.false(true), $.fail(true, 'expected false'))
})
