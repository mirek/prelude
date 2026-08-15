import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('simple', () => {
  assert.deepEqual(G.pipe(G.range(1, 3), G.array), [ 1, 2, 3 ])
})

await test('step', () => {
  assert.deepEqual(G.pipe(G.range(1, 5, 2), G.array), [ 1, 3, 5 ])
})

await test('down', () => {
  assert.deepEqual(G.pipe(G.range(3, 1), G.array), [ 3, 2, 1 ])
})

await test('down', () => {
  assert.deepEqual(G.pipe(G.range(5, 1, -2), G.array), [ 5, 3, 1 ])
})

await test('fractional steps reach the inclusive end without drift', () => {
  assert.deepEqual([ ...G.range(0, 0.3, 0.1) ], [ 0, 0.1, 0.2, 0.3 ])
  assert.deepEqual([ ...G.range(1, 1.3, 0.1) ], [ 1, 1.1, 1.2, 1.3 ])
  assert.deepEqual([ ...G.range(0, 1, 0.25) ], [ 0, 0.25, 0.5, 0.75, 1 ])
  // Intermediate values carry ordinary floating point error (0.3 - 0.1 !== 0.2), but the
  // count is right and both ends are exact.
  const down = [ ...G.range(0.3, 0, -0.1) ]
  assert.equal(down.length, 4)
  assert.deepEqual([ down[0], down[3] ], [ 0.3, 0 ])
  assert.ok(Math.abs(down[1] - 0.2) < 1e-12 && Math.abs(down[2] - 0.1) < 1e-12)
})

await test('zero, NaN and infinite steps are rejected instead of looping', () => {
  assert.throws(() => G.range(1, 5, 0).next(), RangeError)
  assert.throws(() => G.range(1, 5, NaN).next(), RangeError)
  assert.throws(() => G.range(1, 5, Infinity).next(), RangeError)
  assert.deepEqual([ ...G.range(5, 1) ], [ 5, 4, 3, 2, 1 ])
  assert.deepEqual([ ...G.range(1, 5, -1) ], [])
  assert.deepEqual([ ...G.range(3, 3) ], [ 3 ])
})
