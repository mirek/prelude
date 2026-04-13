import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('boolean', () => {
  assert.deepEqual($.boolean(true), $.ok(true))
  assert.deepEqual($.boolean(false), $.ok(false))
  assert.deepEqual($.boolean(0), $.fail(0, 'expected boolean'))
})
