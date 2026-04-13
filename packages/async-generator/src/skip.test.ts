import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('skip', async () => {
  assert.deepEqual(await G.pipe(
    G.range(1, 5),
    G.skip(2),
    G.array
  ), [ 3, 4, 5 ])
})
