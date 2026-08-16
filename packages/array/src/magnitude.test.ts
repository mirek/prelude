import * as A from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('magnitude', () => {
  assert.equal(A.magnitude([]), 0)
  assert.equal(A.magnitude([ 3, 4 ]), 5)
})

await test('magnitude neither underflows nor overflows for tiny and huge components', () => {
  assert.equal(A.magnitude([ 1e-200, 0 ]), 1e-200)
  assert.equal(A.magnitude([ 0, -1e200 ]), 1e200)
  // 3e200 and 4e200 are not exact binary fractions, so allow the last-bit rounding of the ratio.
  assert.ok(Math.abs(A.magnitude([ 3e-200, 4e-200 ]) / 5e-200 - 1) < 1e-15)
  assert.ok(Math.abs(A.magnitude([ 3e200, 4e200 ]) / 5e200 - 1) < 1e-15)
})
