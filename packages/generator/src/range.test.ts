import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('simple', () => {
  assert.deepEqual(G.pipe(G.range(1, 3), G.array), [ 1, 2, 3 ])
})

await test('step', () => {
  assert.deepEqual(G.pipe(G.range(1, 5, 2), G.array), [ 1, 3, 5 ])
})

await test('down', () => {
  assert.deepEqual(G.pipe(G.range(3, 1), G.array), [ 3, 2, 1 ])
})

await test('down', () => {
  assert.deepEqual(G.pipe(G.range(5, 1, -2), G.array), [ 5, 3, 1 ])
})
