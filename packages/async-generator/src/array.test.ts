import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('array', async () => {
  assert.deepEqual(await G.pipe(
    G.range(1, 5),
    G.array
  ), [ 1, 2, 3, 4, 5 ])
})
