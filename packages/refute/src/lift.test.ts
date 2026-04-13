import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('lift', () => {

  const refute = $.object({
    str: 'a' as const,
    one: 1 as const,
    t: true as const,
    f: false as const
  })

  assert.deepEqual($.reason(refute)({}), 'Invalid value at key str, expected a, got undefined.')
  assert.deepEqual($.reason(refute)({ str: 'a' }), 'Invalid value at key one, expected 1, got undefined.')
  assert.deepEqual($.reason(refute)({ str: 'a', one: 1 }), 'Invalid value at key t, expected true, got undefined.')
  assert.deepEqual($.reason(refute)({ str: 'a', one: 1, t: true }), 'Invalid value at key f, expected false, got undefined.')
  assert.deepEqual($.reason(refute)({ str: 'a', one: 1, t: true, f: false }), undefined)

})
