import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('basic', () => {

  const refute = $.object({
    foo: $.number,
    bar: $.string
  })

  assert.deepEqual($.reason(refute)({}), 'Invalid value at key foo, expected number, got undefined.')
  assert.deepEqual($.reason(refute)({ foo: 1 }), 'Invalid value at key bar, expected string, got undefined.')
  assert.deepEqual($.reason(refute)({ foo: 'a' }), 'Invalid value at key foo, expected number, got \'a\'.')

  const predicate = $.predicate(refute)
  assert.equal(predicate({}), false)
  assert.equal(predicate({ foo: 1, bar: 'a' }), true)

  const assertFn = $.assert(refute)
  assert.throws(() => assertFn({}), /Invalid value at key foo, expected number, got undefined\./)
  assert.doesNotThrow(() => assertFn({ foo: 1, bar: 'a' }))

})
