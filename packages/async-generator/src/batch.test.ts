import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('batch', async () => {
  // Test basic batching
  const result = await G.pipe(
    G.ofIterable([1, 2, 3, 4, 5, 6, 7, 8]),
    G.batch(3),
    G.array
  )
  assert.deepEqual(result, [[1, 2, 3], [4, 5, 6], [7, 8]])
})

await test('batch with exact multiple', async () => {
  const result = await G.pipe(
    G.ofIterable([1, 2, 3, 4, 5, 6]),
    G.batch(3),
    G.array
  )
  assert.deepEqual(result, [[1, 2, 3], [4, 5, 6]])
})

await test('batch with single item batches', async () => {
  const result = await G.pipe(
    G.ofIterable([1, 2, 3]),
    G.batch(1),
    G.array
  )
  assert.deepEqual(result, [[1], [2], [3]])
})

await test('batch throws for invalid length', async () => {
  assert.throws(() => G.batch(0), /Expected batch length to be at least 1/)
})
