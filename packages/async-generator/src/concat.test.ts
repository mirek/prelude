import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('concat', async () => {
  assert.deepEqual(await G.pipe(
    G.concat(
      G.ofIterable([ 1, 2, 3 ]),
      G.ofIterable([ 4, 5, 6 ]),
      G.ofIterable([ 7 ])
    ),
    G.array
  ), [ 1, 2, 3, 4, 5, 6, 7 ])
})
