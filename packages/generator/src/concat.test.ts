import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('concat', () => {
  assert.deepEqual(G.array(G.concat(
    G.range(1, 3),
    G.range(4, 6)
  )), [1, 2, 3, 4, 5, 6])
})
