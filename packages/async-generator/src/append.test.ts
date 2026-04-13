import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('append', async () => {
  assert.deepEqual(await G.pipe(
    G.ofIterable([ 3, 4 ]),
    G.append([ 5, 6 ]),
    G.array
  ), [ 3, 4, 5, 6 ])
})
