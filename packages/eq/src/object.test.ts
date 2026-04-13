import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('object', () => {
  type A = { xs?: string[] }
  const f: $.Eq<A> = $.object({ xs: $.undefinedOr($.array($.string)) })
  assert.equal(f({ xs: ['a', 'b'] }, { xs: ['a', 'b'] }), true)
  assert.equal(f({ xs: ['a', 'b'] }, { xs: ['a', 'b', 'c'] }), false)
  assert.equal(f({ xs: ['a', 'b'] }, { xs: undefined }), false)
  assert.equal(f({ xs: undefined }, {}), true)
  assert.equal(f({}, { xs: undefined }), true)
  assert.equal(f({}, {}), true)
})
