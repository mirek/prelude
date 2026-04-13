import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('skip', () => {
  assert.deepEqual(G.pipe(G.from(1), G.skip(3), G.take(2), G.array), [
    4, 5
  ])
  assert.deepEqual(G.pipe([ 1, 2, 3, 4, 5, 6 ], G.skip(3), G.array), [
    4, 5, 6
  ])
})
