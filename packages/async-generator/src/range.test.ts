import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('range', async () => {
  assert.deepEqual(await G.pipe(
    G.range(1, 5),
    G.array
  ), [ 1, 2, 3, 4, 5 ])
  assert.deepEqual(await G.pipe(
    G.range(0, 0),
    G.array
  ), [ 0 ])
  assert.deepEqual(await G.pipe(
    G.range(0, 10, 2),
    G.array
  ), [ 0, 2, 4, 6, 8, 10 ])
})

await test('fractional steps reach the inclusive end and zero steps are rejected', async () => {
  assert.deepEqual(await G.pipe(G.range(0, 0.3, 0.1), G.array), [ 0, 0.1, 0.2, 0.3 ])
  await assert.rejects(G.pipe(G.range(1, 5, 0), G.array), RangeError)
  assert.deepEqual(await G.pipe(G.range(10, 0, -2), G.array), [ 10, 8, 6, 4, 2, 0 ])
})

await test('tolerance is ulp-scale, stays below the interval and never overflows the end', async () => {
  assert.deepEqual(await G.pipe(G.range(0, 1, 1e10), G.array), [ 0 ])
  assert.deepEqual(await G.pipe(G.range(1, 5, -1e10), G.array), [])
  assert.deepEqual(await G.pipe(G.range(1, 0, -1e10), G.array), [ 1 ])
  assert.deepEqual(await G.pipe(G.range(0, 0.9999999995, 1), G.array), [ 0 ])
  assert.deepEqual(await G.pipe(G.range(0, 1.0000000005, 1), G.array), [ 0, 1 ])
  assert.deepEqual(await G.pipe(G.range(0, 2.1, 0.7), G.array), [ 0, 0.7, 1.4, 2.1 ])
  assert.deepEqual(await G.pipe(G.range(1e16, 1e16 + 2, 2), G.array), [ 1e16, 1e16 + 2 ])
  // `end + tolerance` must not overflow to Infinity, which made this loop forever.
  assert.deepEqual(await G.pipe(G.range(0, Number.MAX_VALUE, Number.MAX_VALUE), G.take(5), G.array), [ 0, Number.MAX_VALUE ])
  // An infinite end gets no tolerance, so values are not snapped onto it.
  assert.deepEqual(await G.pipe(G.range(0, Infinity), G.take(3), G.array), [ 0, 1, 2 ])
})
