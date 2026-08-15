import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('eq, instance and nullish are exported from the package index', () => {
  assert.deepEqual($.eq(1)(1), $.ok(1))
  assert.equal($.failed($.eq(1)(2)), true)
  assert.equal($.failed($.instance(Date)(new Date(0))), false)
  assert.equal($.failed($.instance(Date)('x')), true)
  assert.deepEqual($.nullish(null), $.ok(null))
  assert.deepEqual($.nullish(undefined), $.ok(undefined))
  assert.equal($.failed($.nullish(0)), true)
})
