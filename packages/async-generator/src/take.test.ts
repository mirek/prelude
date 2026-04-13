import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('take without return', async () => {
  assert.deepEqual(await G.pipe(
    G.ofIterable([ 1, 2, 3, 4 ]),
    G.take(2),
    G.array
  ), [
    1, 2
  ])
})
