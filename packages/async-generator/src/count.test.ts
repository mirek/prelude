import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('count', async () => {
  assert.deepEqual(await G.pipe(
    G.range(1, 10),
    G.count(_ => _ % 2 === 0)
  ), 5)
})
