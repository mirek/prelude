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
