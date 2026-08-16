import * as A from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('normalized returns a unit vector for tiny and ordinary vectors', () => {
  assert.deepEqual(A.normalized([ 1e-20, 0 ]), [ 1, 0 ])
  assert.deepEqual(A.normalized([ 0, -1e-100 ]), [ 0, -1 ])
  const unit = A.normalized([ 3, 4 ])
  assert.ok(Math.abs(unit[0] - 0.6) < 1e-15 && Math.abs(unit[1] - 0.8) < 1e-15)
  assert.deepEqual(A.normalized([ 0, 0 ]), [ 0, 0 ], 'the zero vector stays zero instead of dividing by zero')
})

await test('normalize scales in place', () => {
  const values = [ 1e-20, 0 ]
  A.normalize(values)
  assert.deepEqual(values, [ 1, 0 ])
  const zero = [ 0, 0 ]
  A.normalize(zero)
  assert.deepEqual(zero, [ 0, 0 ])
})

await test('normalized does not mistake tiny or huge vectors for the zero vector', () => {
  // Squaring 1e-200 underflows to 0 and squaring 1e200 overflows to Infinity, so a naive
  // sum-of-squares magnitude cannot tell these apart from the zero vector.
  assert.deepEqual(A.normalized([ 1e-200, 0 ]), [ 1, 0 ])
  assert.deepEqual(A.normalized([ 1e200, 0 ]), [ 1, 0 ])
  assert.deepEqual(A.normalized([ 0, -1e200 ]), [ 0, -1 ])
  // Subnormal: `1 / m` would overflow to Infinity.
  assert.deepEqual(A.normalized([ 1e-320, 0 ]), [ 1, 0 ])
  const subnormal = [ 0, 1e-320 ]
  A.normalize(subnormal)
  assert.deepEqual(subnormal, [ 0, 1 ])
  assert.ok(Math.abs(A.magnitude(A.normalized([ 1e-160, 3e-160 ])) - 1) < 1e-12)
  assert.ok(Math.abs(A.magnitude(A.normalized([ 1e160, 3e160 ])) - 1) < 1e-12)
})

await test('normalize does not mistake tiny or huge vectors for the zero vector', () => {
  const tiny = [ 1e-200, 0 ]
  A.normalize(tiny)
  assert.deepEqual(tiny, [ 1, 0 ])
  const huge = [ 1e200, 0 ]
  A.normalize(huge)
  assert.deepEqual(huge, [ 1, 0 ])
})
