import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('and', () => {

  const f = $.and(
    $.object({ foo: $.string, bar: $.string, baz: $.string }),
    $.object({ bar: $.string, baz: 'BAZ' as const })
  )

  assert.equal($.safeReason(f)({ foo: 'FOO', bar: 'BAR', baz: 'BAZ' }), undefined)
  assert.equal($.safeReason(f)({ foo: 'FOO', bar: 'BAR', baz: 'xyz' }), 'Invalid value at key baz, expected BAZ.')

})
