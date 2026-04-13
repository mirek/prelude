import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('assert', () => {
  assert.throws(() => $.assert($.number)('a'), /Invalid value expected number, got 'a'\./)
  assert.throws(() => $.assert($.number, $.reasonWithoutReceived)('a'), /Invalid value expected number\./)
})
