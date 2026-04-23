import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('array identity on success', () => {
  const a = [1, 2, 3]
  assert.equal($.array($.number)(a), a)
})

await test('array throws with indexed path', () => {
  assert.throws(
    () => $.array($.number)([1, 'x', 3]),
    /Expected \.1 to be a number, got 'x'\./
  )
})

await test('array rejects non-array', () => {
  assert.throws(() => $.array($.number)({}), /Expected an array, got \{\}\./)
})

await test('object identity on success', () => {
  const v = { foo: 'a', bar: 1 }
  const a = $.object({ foo: $.string, bar: $.number })
  assert.equal(a(v), v)
})

await test('object throws with key path', () => {
  const a = $.object({ foo: $.string, bar: $.number })
  assert.throws(
    () => a({ foo: 'a', bar: 'x' }),
    /Expected \.bar to be a number, got 'x'\./
  )
})

await test('nested .foo.bar.0.baz path', () => {
  const a = $.object({
    foo: $.object({
      bar: $.array($.object({
        baz: $.string
      }))
    })
  })
  assert.throws(
    () => a({ foo: { bar: [{ baz: 1 }] } }),
    (err: unknown) => {
      assert.ok(err instanceof $.AssertionError)
      assert.equal(err.message, 'Expected .foo.bar.0.baz to be a string, got 1.')
      assert.equal(err.expected, 'a string')
      assert.equal(err.received, 1)
      assert.equal(err.key, 'foo')
      assert.ok(err.cause instanceof $.AssertionError)
      return true
    }
  )
})

await test('tuple', () => {
  const a = $.tuple($.string, $.number)
  assert.deepEqual(a(['a', 1]), ['a', 1])
  assert.throws(() => a(['a', 'b']), /Expected \.1 to be a number/)
  assert.throws(() => a(['a', 1, 2]), /not longer than 2/)
})

await test('record', () => {
  const a = $.record($.string, $.number)
  assert.deepEqual(a({ a: 1, b: 2 }), { a: 1, b: 2 })
  assert.throws(() => a({ a: 'x' }), /Expected \.a to be a number/)
})

await test('partial', () => {
  const a = $.partial({ foo: $.string, bar: $.number })
  assert.deepEqual(a({}), {})
  assert.deepEqual(a({ foo: 'x' }), { foo: 'x' })
  assert.throws(() => a({ foo: 1 }), /Expected \.foo to be a string/)
})

await test('exact rejects extras', () => {
  const a = $.exact({ foo: $.string })
  assert.deepEqual(a({ foo: 'a' }), { foo: 'a' })
  assert.throws(() => a({ foo: 'a', extra: 1 }), /no extra keys/)
})

await test('exactPartial', () => {
  const a = $.exactPartial({ foo: $.string })
  assert.deepEqual(a({}), {})
  assert.deepEqual(a({ foo: 'a' }), { foo: 'a' })
  assert.throws(() => a({ foo: 'a', extra: 1 }), /no extra keys/)
})
