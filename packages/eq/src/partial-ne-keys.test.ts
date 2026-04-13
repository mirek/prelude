import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('partial-ne-keys', () => {

  const f = $.partialNeKeys({
    foo: $.number,
    bar: $.array($.number)
  })
  const a = { foo: 1, bar: [ 2, 3, 5 ] }
  assert.deepEqual(f(a, { foo: 1, bar: [ 2, 3, 5 ] }), [])
  assert.deepEqual(f(a, { foo: 1 }), [])
  assert.deepEqual(f(a, { bar: [2, 3, 5] }), [])
  assert.deepEqual(f(a, { foo: 1, bar: [ 2, 3, 4 ] }), [ 'bar' ])
  assert.deepEqual(f(a, { foo: 2, bar: [ 2, 3, 5 ] }), [ 'foo' ])
  assert.deepEqual(f(a, { foo: 2, bar: [ 2, 3, 4 ] }), [ 'foo', 'bar' ])
  assert.deepEqual(f(a, { foo: 2 }), [ 'foo' ])
  assert.deepEqual(f(a, { bar: [ 2, 3, 4 ] }), [ 'bar' ])
})
