import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('positive is exported from the package index', () => {
  assert.equal($.positive(1), true)
  assert.equal($.positive(0), false)
  assert.equal($.positive(-1), false)
  assert.equal($.positive('1'), false)
})

await test('regexp predicates are stateless with sticky or global flags', () => {
  const sticky = $.regexp(/^ab/y)
  assert.deepEqual([ sticky('abc'), sticky('abc'), sticky('abc') ], [ true, true, true ])
  const global = $.regexp(/a/g)
  assert.deepEqual([ global('a'), global('a') ], [ true, true ])
  assert.equal(global('b'), false)
})

await test('exact treats Object.prototype names as extra keys', () => {
  const p = $.exact({ a: $.string })
  assert.equal(p({ a: 'x', toString: 1 }), false)
  assert.equal(p({ a: 'x', constructor: 1 }), false)
  assert.equal(p({ a: 'x' }), true)
})

await test('regexp accepts a frozen non-global regexp', () => {
  assert.equal($.regexp(Object.freeze(/a/))('a'), true)
})
