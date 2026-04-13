import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('simple', () => {
  assert.deepEqual(G.pipe(
    G.range(1, 10),
    G.batch(3),
    G.array
  ), [
    [ 1, 2, 3 ],
    [ 4, 5, 6 ],
    [ 7, 8, 9 ],
    [ 10 ]
  ])
})
