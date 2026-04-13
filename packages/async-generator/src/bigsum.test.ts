import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('bigsum', async () => {
  assert.equal(await G.pipe(
    G.ofIterable([ 1n, 3n, 5n ]),
    G.bigsum
  ), 9n)
})
