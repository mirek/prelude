import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('buffered and sleep are exported from the package index (as the Readme lists)', async () => {
  assert.equal(typeof G.buffered, 'function')
  assert.equal(typeof G.sleep, 'function')
  assert.deepEqual(await G.pipe(G.ofIterable([ 1, 2, 3 ]), G.buffered(2), G.array), [ 1, 2, 3 ])
  await G.sleep(0)
})
