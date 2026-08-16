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

await test('tolerance is ulp-scale, stays below the interval and never overflows the end', () => {
  // A huge step must not let the start snap across the interval onto the end.
  assert.deepEqual([ ...G.range(0, 1, 1e10) ], [ 0 ])
  assert.deepEqual([ ...G.range(1, 5, -1e10) ], [])
  assert.deepEqual([ ...G.range(1, 0, -1e10) ], [ 1 ])
  // Ends that are genuinely (millions of ulps) away from a value are not snapped onto it.
  assert.deepEqual([ ...G.range(0, 0.9999999995, 1) ], [ 0 ])
  assert.deepEqual([ ...G.range(0, 1.0000000005, 1) ], [ 0, 1 ])
  // ...but rounding error of a few ulps still reaches the inclusive end (3 * 0.7 = 2.0999999999999996).
  assert.deepEqual([ ...G.range(0, 2.1, 0.7) ], [ 0, 0.7, 1.4, 2.1 ])
  // A narrow interval at a large magnitude keeps its start (ulp-scale tolerance is capped by step and width).
  assert.deepEqual([ ...G.range(1e16, 1e16 + 2, 1) ].slice(0, 1), [ 1e16 ])
  assert.deepEqual([ ...G.range(1e16, 1e16 + 2, 2) ], [ 1e16, 1e16 + 2 ])
  // `end + tolerance` must not overflow to Infinity, which made this loop forever.
  assert.deepEqual(G.pipe(G.range(0, Number.MAX_VALUE, Number.MAX_VALUE), G.take(5), G.array), [ 0, Number.MAX_VALUE ])
  // An infinite end gets no tolerance, so values are not snapped onto it.
  assert.deepEqual(G.pipe(G.range(0, Infinity), G.take(3), G.array), [ 0, 1, 2 ])
})
