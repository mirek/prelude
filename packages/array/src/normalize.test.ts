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
