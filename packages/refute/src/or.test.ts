import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('or', () => {
  const f = $.or(
    $.number,
    'ABC' as const,
    $.object({ foo: 1 })
  )
  assert.throws(() => $.assert(f)({}), /Invalid value where none of 3 alternatives matched, got \{\}\./)
  assert.equal($.assert(f)('ABC'), 'ABC')
  assert.equal($.assert(f)(42), 42)
  assert.deepEqual($.assert(f)({ foo: 1 }), { foo: 1 })
})
