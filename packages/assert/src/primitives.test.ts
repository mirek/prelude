import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('string', () => {
  assert.equal($.string('x'), 'x')
  assert.throws(() => $.string(1), $.AssertionError)
  assert.throws(() => $.string(1), /Expected a string, got 1\./)
})

await test('number', () => {
  assert.equal($.number(1), 1)
  assert.throws(() => $.number('x'), /Expected a number, got 'x'\./)
})

await test('boolean', () => {
  assert.equal($.boolean(true), true)
  assert.throws(() => $.boolean(1), /Expected a boolean/)
})

await test('null', () => {
  assert.equal($.null(null), null)
  assert.throws(() => $.null(undefined), /Expected null/)
})

await test('undefined', () => {
  assert.equal($.undefined(undefined), undefined)
  assert.throws(() => $.undefined(null), /Expected undefined/)
})

await test('true / false', () => {
  assert.equal($.true(true), true)
  assert.throws(() => $.true(false))
  assert.equal($.false(false), false)
  assert.throws(() => $.false(true))
})

await test('unknown', () => {
  assert.equal($.unknown(1), 1)
  assert.equal($.unknown(undefined), undefined)
})

await test('defined', () => {
  assert.equal($.defined(1), 1)
  assert.equal($.defined(null), null)
  assert.throws(() => $.defined(undefined), /Expected defined/)
})
