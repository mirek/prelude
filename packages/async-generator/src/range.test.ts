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
