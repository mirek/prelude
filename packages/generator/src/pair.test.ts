import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('pair', () => {
  assert.deepEqual(G.pipe(
      G.from(),
      G.pair(G.pipe(
        G.from(),
        G.skip(2)
      )),
      G.take(3),
      G.array
    ), [
    [ 0, 2 ],
    [ 1, 3 ],
    [ 2, 4 ]
  ])
})
