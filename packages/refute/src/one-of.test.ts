import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('one-of', () => {
  assert.deepEqual($.oneOf('a', 'b')('a'), $.ok('a'))
  assert.deepEqual($.oneOf('a', 'b')('c'), $.fail('c', 'none of a, b matched'))
})
