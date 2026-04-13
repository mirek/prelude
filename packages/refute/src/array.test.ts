import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('array', () => {
  assert.deepEqual($.array($.unknown)({}), $.fail({}, 'expected array'))
  assert.deepEqual($.array($.unknown)([]), $.ok([]))
  assert.deepEqual($.array($.number)([1, 2, 3]), $.ok([1, 2, 3]))
  assert.deepEqual($.array($.number)([1, '2', 3]), $.fail('2', 'at index 1, expected number'))
})
