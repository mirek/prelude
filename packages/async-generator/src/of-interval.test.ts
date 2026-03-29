import * as G from './index.js'

test('interval produces values with correct indices', async () => {
  const values = await G.pipe(
    G.ofInterval(10),
    G.take(5),
    G.map(_ => _.index),
    G.array
  )
  expect(values).toEqual([0, 1, 2, 3, 4])
})

test('interval produces timestamps', async () => {
  const values = await G.pipe(
    G.ofInterval(10),
    G.take(3),
    G.array
  )
  expect(values.length).toBe(3)
  for (const value of values) {
    expect(value.generatedAt).toBeInstanceOf(Date)
    expect(value.yieldedAt).toBeInstanceOf(Date)
    expect(typeof value.index).toBe('number')
  }
})
