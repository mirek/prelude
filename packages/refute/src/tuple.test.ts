import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('tuple', () => {
  assert.deepEqual($.tuple($.number, $.string)(null), $.fail(null, 'expected array'))
  assert.deepEqual($.tuple($.number, $.string)([1, 'a']), $.ok([1, 'a']))
  assert.deepEqual($.tuple($.number, $.string)([1, 2]), $.fail(2, 'at index 1, expected string'))
  assert.deepEqual($.tuple($.number, $.string)([1, 'a', false]), $.fail([1, 'a', false], 'expected array not longer than 2'))
})

await test('tuple rejects arrays missing required positions but allows optional tails', () => {
  assert.deepEqual($.tuple($.number, $.string)([ 1 ]), $.fail(undefined, 'at index 1, expected string'))
  assert.equal($.failed($.tuple($.number, $.string)([])), true)
  assert.deepEqual($.tuple($.number, $.undefinedOr($.string))([ 1 ]), $.ok([ 1 ]))
  assert.deepEqual($.tuple($.number, $.undefinedOr($.string))([ 1, 'a' ]), $.ok([ 1, 'a' ]))
})
