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
