import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('prepend', async () => {
  assert.deepEqual(await G.pipe(
    G.range(5, 10),
    G.prepend([ 2, 3, 4 ]),
    G.array
  ), [ 2, 3, 4, 5, 6, 7, 8, 9, 10 ])
})
