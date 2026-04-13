import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('simple', () => {
  assert.deepEqual(G.pipe(
    G.range(1, 5),
    G.at(2)
  ), 3)
  assert.throws(() => G.pipe(
    G.range(1, 5),
    G.at(5)
  ), /index 5 out of bounds/)
})
