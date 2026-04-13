import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('string', () => {
  const x = JSON.parse('"a"')
  if ($.string(x)) {
    assert.equal(x === 'a', true)
  }
})
