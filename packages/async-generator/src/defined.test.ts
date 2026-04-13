import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('defined', async () => {
  assert.deepEqual(await G.pipe(
    G.ofIterable([ 1, undefined, 3, undefined, 5 ]),
    G.defined,
    G.array
  ), [ 1, 3, 5 ])
})
