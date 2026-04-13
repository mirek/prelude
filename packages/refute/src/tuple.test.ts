import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('tuple', () => {
  assert.deepEqual($.tuple($.number, $.string)(null), $.fail(null, 'expected array'))
  assert.deepEqual($.tuple($.number, $.string)([1, 'a']), $.ok([1, 'a']))
  assert.deepEqual($.tuple($.number, $.string)([1, 2]), $.fail(2, 'at index 1, expected string'))
  assert.deepEqual($.tuple($.number, $.string)([1, 'a', false]), $.fail([1, 'a', false], 'expected array not longer than 2'))
})
