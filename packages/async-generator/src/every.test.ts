import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('every', async () => {
  assert.deepEqual(await G.pipe(
    G.range(1, 10),
    G.every(_ => _ % 2 === 0)
  ), false)
  assert.deepEqual(await G.pipe(
    G.range(1, 10),
    G.every(_ => _ < 11)
  ), true)
})
