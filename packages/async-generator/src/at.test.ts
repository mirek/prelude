import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('at', async () => {
  assert.equal(await G.pipe(
    G.ofIterable([ 1, 2, 3 ]),
    G.at(1)
  ), 2)
})
