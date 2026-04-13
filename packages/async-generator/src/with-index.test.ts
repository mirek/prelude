import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('withIndex', async () => {
  assert.deepEqual(await G.pipe(
    G.range(1, 5),
    G.withIndex,
    G.array
  ), [
    { index: 0, value: 1 },
    { index: 1, value: 2 },
    { index: 2, value: 3 },
    { index: 3, value: 4 },
    { index: 4, value: 5 }
  ])
})
