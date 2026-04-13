import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('defined', () => {
  assert.deepEqual($.defined(1), $.ok(1))
  assert.deepEqual($.defined(undefined), $.fail(undefined, 'expected defined'))
})
