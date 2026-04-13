import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('cartesianProduct', async () => {
  assert.deepEqual(await G.pipe(
    G.ofIterable([ 1, 2, 3 ]),
    G.cartesianProduct(G.ofIterable([ 4, 5, 6 ])),
    G.array
  ), [
    [ 1, 4 ],
    [ 1, 5 ],
    [ 1, 6 ],
    [ 2, 4 ],
    [ 2, 5 ],
    [ 2, 6 ],
    [ 3, 4 ],
    [ 3, 5 ],
    [ 3, 6 ]
  ])
})
