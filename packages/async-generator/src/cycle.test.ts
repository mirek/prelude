import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('cycle', async () => {
  assert.deepEqual(await G.pipe(
    G.range(1, 2),
    G.cycle(3),
    G.array
  ), [
    1, 2, 1, 2, 1, 2
  ])
})

await test('cycle 0 times', async () => {
  assert.deepEqual(await G.pipe(
    G.range(1, 2),
    G.cycle(0),
    G.array
  ), [])
})

await test('cycle on no values', async () => {
  assert.deepEqual(await G.pipe(
    G.ofIterable([]),
    G.cycle(3),
    G.array
  ), [])
})
