import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('exact', () => {
  assert.deepEqual($.exact({})(null), $.fail(null, 'expected object'))
})

await test('single extra key', () => {
  assert.deepEqual($.safeReason($.exact({ foo: 'FOO', bar: 'BAR' }))({ foo: 'FOO', bar: 'BAR', baz: 'BAZ' }), 'Invalid value has unexpected extra key baz.')
})

await test('multiple extra keys', () => {
  assert.deepEqual($.safeReason($.exact({ foo: 'FOO', bar: 'BAR' }))({ foo: 'FOO', bar: 'BAR', baz: 'BAZ', aux: 'AUX' }), 'Invalid value has unexpected extra keys baz, aux.')
})

await test('keys named after Object.prototype members are extras', () => {
  const r = $.exact({ a: $.number })
  assert.equal($.failed(r(JSON.parse('{"a":1,"constructor":{"prototype":{}}}'))), true)
  assert.equal($.failed(r({ a: 1, toString: 2 })), true)
  assert.equal($.failed(r({ a: 1 })), false)
  const p = $.exactPartial({ a: $.number })
  assert.equal($.failed(p({ valueOf: 1 })), true)
  assert.equal($.failed(p({ hasOwnProperty: 1 })), true)
  assert.equal($.failed(p({})), false)
})
