import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('compact', async () => {
  assert.deepEqual(await G.pipe(
    G.ofIterable([ 1, null, 2, 3, null, 4, 5 ]),
    G.compact,
    G.array
  ), [ 1, 2, 3, 4, 5 ])
})
