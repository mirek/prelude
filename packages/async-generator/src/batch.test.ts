import * as G from './index.js'

test('batch', async () => {
  // Test basic batching
  const result = await G.pipe(
    G.ofIterable([1, 2, 3, 4, 5, 6, 7, 8]),
    G.batch(3),
    G.array
  )
  expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7, 8]])
})

test('batch with exact multiple', async () => {
  const result = await G.pipe(
    G.ofIterable([1, 2, 3, 4, 5, 6]),
    G.batch(3),
    G.array
  )
  expect(result).toEqual([[1, 2, 3], [4, 5, 6]])
})

test('batch with single item batches', async () => {
  const result = await G.pipe(
    G.ofIterable([1, 2, 3]),
    G.batch(1),
    G.array
  )
  expect(result).toEqual([[1], [2], [3]])
})

test('batch throws for invalid length', async () => {
  expect(() => G.batch(0)).toThrow('Expected batch length to be at least 1')
})
