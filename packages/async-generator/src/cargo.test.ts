import * as G from './index.js'

test('cargo batches values dynamically', async () => {
  // Create a controlled source that we can feed values into
  const values = [1, 2, 3, 4, 5]

  const batches = await G.pipe(
    G.ofIterable(values),
    G.cargo(),
    G.array
  )

  // All values should be processed
  const allValues = batches.flat()
  expect(allValues).toEqual(values)

  // Should have at least one batch
  expect(batches.length).toBeGreaterThan(0)
})

test('cargo respects max length', async () => {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  const batches = await G.pipe(
    G.ofIterable(values),
    G.cargo(3),  // Max 3 items per batch
    G.array
  )

  // All values should be processed
  const allValues = batches.flat()
  expect(allValues).toEqual(values)

  // Each batch should have at most 3 items
  for (const batch of batches) {
    expect(batch.length).toBeLessThanOrEqual(3)
  }
})

test('cargo handles empty input', async () => {
  const batches = await G.pipe(
    G.ofIterable([]),
    G.cargo(),
    G.array
  )

  expect(batches).toEqual([])
})
