import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('partial', () => {
  assert.deepEqual($.partial({ a: $.number })(null), $.fail(null, 'expected object'))
  assert.deepEqual($.partial({ a: $.number })({}), $.ok({}))
  assert.deepEqual($.partial({ a: $.number })({ b: 1 }), $.ok({ b: 1 }))
  assert.deepEqual($.partial({ a: $.number })({ a: '1' }), $.fail('1', 'at key a, expected number'))
  assert.deepEqual($.partial({ a: $.number })({ a: 1, b: 2 }), $.ok({ a: 1, b: 2 }))
})
