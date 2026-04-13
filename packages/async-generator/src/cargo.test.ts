import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('cargo batches values dynamically', async () => {
  // Create a controlled source that we can feed values into
  const values = [1, 2, 3, 4, 5]

  const batches = await G.pipe(
    G.ofIterable(values),
    G.cargo(),
    G.array
  )

  // All values should be processed
  const allValues = batches.flat()
  assert.deepEqual(allValues, values)

  // Should have at least one batch
  assert.ok((batches.length) > (0))
})

await test('cargo respects max length', async () => {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  const batches = await G.pipe(
    G.ofIterable(values),
    G.cargo(3),  // Max 3 items per batch
    G.array
  )

  // All values should be processed
  const allValues = batches.flat()
  assert.deepEqual(allValues, values)

  // Each batch should have at most 3 items
  for (const batch of batches) {
    assert.ok((batch.length) <= (3))
  }
})

await test('cargo handles empty input', async () => {
  const batches = await G.pipe(
    G.ofIterable([]),
    G.cargo(),
    G.array
  )

  assert.deepEqual(batches, [])
})
