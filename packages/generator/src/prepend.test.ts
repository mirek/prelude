import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('simple', () => {
  assert.deepEqual(G.pipe(
    G.range(1, 5),
    G.prepend(G.range(1, 3)),
    G.array
  ), [
    1, 2, 3,
    1, 2, 3, 4, 5
  ])
})
