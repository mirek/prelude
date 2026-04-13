import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('filter', async () => {
  assert.deepEqual(await G.pipe(
    G.range(1, 10),
    G.filter(_ => _ % 2 === 0),
    G.array
  ), [ 2, 4, 6, 8, 10 ])
})
