import * as E from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('is, or and weakNullishOr are exported from the package index', () => {
  assert.equal(E.is(NaN, NaN), true)
  assert.equal(E.is(0, -0), false)
  const either = E.or<number>((a, b) => a === b, (a, b) => a === -b)
  assert.equal(either(1, -1), true)
  assert.equal(either(1, 2), false)
  const weak = E.weakNullishOr<number, number>((a, b) => a === b)
  assert.equal(weak(null, undefined), true)
  assert.equal(weak(null, 1), false)
  assert.equal(weak(1, 1), true)
})
