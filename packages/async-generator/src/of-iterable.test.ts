import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('ofIterable', async () => {
  assert.deepEqual(await G.pipe(
    G.ofIterable([ 1, 2, 3 ]),
    G.array
  ), [ 1, 2, 3 ])
})
