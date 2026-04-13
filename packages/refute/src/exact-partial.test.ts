import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('exact partial', () => {
  assert.deepEqual($.exactPartial({})({}), $.ok({}))
  assert.deepEqual($.exactPartial({})(undefined), $.fail(undefined, 'expected object'))
  assert.deepEqual($.exactPartial({})({ a: 1 }), $.fail({ a: 1 }, 'unexpected key a'))
  assert.deepEqual($.exactPartial({ a: $.number })({ a: 1 }), $.ok({ a: 1 }))
  assert.deepEqual($.exactPartial({ a: $.number })({ a: '1' }), $.fail('1', 'at key a, expected number'))
  assert.deepEqual($.exactPartial({ a: $.number })({ a: undefined }), $.ok({ a: undefined }))
})
