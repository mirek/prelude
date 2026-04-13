import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('42 composites', () => {
  assert.deepEqual(
    G.pipe(G.composites(), G.take(42), G.array),
    [
      4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22, 24, 25, 26, 27, 28,
      30, 32, 33, 34, 35, 36, 38, 39, 40, 42, 44, 45, 46, 48, 49, 50, 51,
      52, 54, 55, 56, 57, 58, 60
    ]
  )
})
