import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('ordered', async () => {
  assert.deepEqual(await G.pipe(
    G.ofIterable([
      { index: 2, value: 'a' },
      { index: 0, value: 'b' },
      { index: 1, value: 'c' }
    ]),
    G.unwrapIndexed,
    G.array
  ), [
    'b',
    'c',
    'a'
  ])
})

await test('ordered with invalid 0-based indices', async () => {
  await assert.rejects(G.pipe(
    G.ofIterable([
      { index: 1, value: 'a' },
      { index: 2, value: 'b' },
      { index: 3, value: 'c' }
    ]),
    G.unwrapIndexed,
    G.array
  ), /Invalid 0-based indices, didn't see index 0\./)

  await assert.rejects(G.pipe(
    G.ofIterable([
      { index: 0, value: 'a' },
      { index: 1, value: 'b' },
      { index: 3, value: 'c' }
    ]),
    G.unwrapIndexed,
    G.array
  ), /Invalid 0-based indices, didn't see index 2\./)
})
