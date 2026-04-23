import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('and', () => {
  const a = $.and($.number, $.positive)
  assert.equal(a(1), 1)
  assert.throws(() => a(-1), /Expected a positive number/)
  assert.throws(() => a('x'), /Expected a number/)
})

await test('or', () => {
  const a = $.or($.number, $.string)
  assert.equal(a(1), 1)
  assert.equal(a('x'), 'x')
  assert.throws(() => a(true), /Expected a number or a string, got true\./)
})

await test('nullOr', () => {
  const a = $.nullOr($.string)
  assert.equal(a(null), null)
  assert.equal(a('x'), 'x')
  assert.throws(() => a(1), /Expected a string or null, got 1\./)
})

await test('nullOr preserves nested path', () => {
  const a = $.nullOr($.object({ foo: $.string }))
  assert.throws(() => a({ foo: 1 }), /Expected \.foo to be a string, got 1\./)
})

await test('undefinedOr', () => {
  const a = $.undefinedOr($.string)
  assert.equal(a(undefined), undefined)
  assert.equal(a('x'), 'x')
  assert.throws(() => a(1), /Expected a string or undefined/)
})

await test('nullishOr', () => {
  const a = $.nullishOr($.string)
  assert.equal(a(null), null)
  assert.equal(a(undefined), undefined)
  assert.equal(a('x'), 'x')
  assert.throws(() => a(1), /Expected a string or nullish/)
})

await test('lifted primitives in object', () => {
  const a = $.object({ kind: 'user' as const, n: $.number })
  assert.deepEqual(a({ kind: 'user', n: 1 }), { kind: 'user', n: 1 })
  assert.throws(() => a({ kind: 'admin', n: 1 }), /Expected \.kind to be 'user'/)
})
