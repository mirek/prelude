import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('positive is exported from the package index', () => {
  assert.equal($.positive(1), true)
  assert.equal($.positive(0), false)
  assert.equal($.positive(-1), false)
  assert.equal($.positive('1'), false)
})
