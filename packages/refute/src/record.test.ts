import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('record', () => {
  assert.deepEqual($.record($.string, $.number)(null), $.fail(null, 'expected object'))
  assert.deepEqual($.record($.string, $.number)({}), $.ok({}))
  assert.deepEqual($.record($.string, $.number)({ a: 1 }), $.ok({ a: 1 }))
  assert.deepEqual($.record($.string, $.number)({ a: '1' }), $.fail('1', 'at key a, expected number'))
  assert.deepEqual($.record($.regexp(/^[a-z]+$/), $.number)({ a1: '1' }), $.fail('a1', 'key, expected to match /^[a-z]+$/.'))
})
