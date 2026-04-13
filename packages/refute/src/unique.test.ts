import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('unique', () => {
  assert.deepEqual($.unique($.string)(null), $.fail(null, 'expected array'))
  assert.deepEqual($.unique($.string)([]), $.ok([]))
  assert.deepEqual($.unique($.string)(['a']), $.ok(['a']))
  assert.deepEqual($.unique($.string)(['a', 'a']), $.fail('a', 'duplicate value at index 1'))
  assert.deepEqual($.unique($.string)(['a', 'b']), $.ok(['a', 'b']))
  assert.deepEqual($.unique($.string)(['a', 'b', 'a']), $.fail('a', 'duplicate value at index 2'))
  assert.deepEqual($.unique($.string)(['a', 'b', 1]), $.fail(1, 'at index 2, expected string'))
  assert.deepEqual($.unique($.string, String)(['a', 'b', 1]), $.fail(1, 'at index 2, expected string'))
})
