import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('zip', () => {
  assert.deepEqual(G.pipe(G.zip(
    G.range(1, 5),
    [ 'a', 'b', 'c' ]
  ), G.array), [
    [ 1, 'a' ],
    [ 2, 'b' ],
    [ 3, 'c' ]
  ])
})
