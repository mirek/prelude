import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('regexp', () => {
  assert.deepEqual($.regexp(/^foo/dy)('foo'), $.ok('foo'))
})

await test('regexp accepts a frozen non-global regexp', () => {
  assert.deepEqual($.regexp(Object.freeze(/a/))('a'), $.ok('a'))
})
