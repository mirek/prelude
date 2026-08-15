import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('record compares values under shared keys', () => {
  const f = $.record($.array($.string))
  assert.equal(f({ x: [ 'a' ] }, { x: [ 'a' ] }), true)
  assert.equal(f({ x: [ 'a' ] }, { x: [ 'b' ] }), false)
  assert.equal(f({}, {}), true)
})

await test('a key missing on one side is not equal (and does not throw)', () => {
  const f = $.record($.array($.string))
  assert.equal(f({}, { x: [] }), false)
  assert.equal(f({ x: [] }, {}), false)
  assert.equal(f({ x: [ 'a' ], y: [ 'b' ] }, { x: [ 'a' ] }), false)
  assert.equal(f({ x: [ 'a' ] }, { x: [ 'a' ], y: [ 'b' ] }), false)
})

await test('a missing key equals an explicit undefined value', () => {
  const f = $.record<string | undefined>($.undefinedOr($.string))
  assert.equal(f({ x: undefined }, {}), true)
  assert.equal(f({}, { x: undefined }), true)
  assert.equal(f({ x: 'a' }, { x: undefined }), false)
})
