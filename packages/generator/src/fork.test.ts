import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('fork, union', () => {
  assert.deepEqual(G.pipe(
    G.range(1, 5),
    G.fork(
      G.map((_: number) => _ * 2),
      G.map((_: number) => String(_ * 3))
    ),
    G.flatten,
    G.array
  ), [
    2, 4, 6, 8, 10,
    '3', '6', '9', '12', '15'
  ])
})
