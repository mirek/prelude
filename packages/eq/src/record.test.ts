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

await test('inherited names are not treated as present keys', () => {
  const f = $.record($.eq)
  assert.equal(f({}, { constructor: 1 }), false)
  assert.equal(f({ toString: 1 }, {}), false)
  assert.equal(f({ constructor: 1 }, { constructor: 1 }), true)
})
