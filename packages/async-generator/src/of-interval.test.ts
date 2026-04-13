import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('interval produces values with correct indices', async () => {
  const values = await G.pipe(
    G.ofInterval(10),
    G.take(5),
    G.map(_ => _.index),
    G.array
  )
  assert.deepEqual(values, [0, 1, 2, 3, 4])
})

await test('interval produces timestamps', async () => {
  const values = await G.pipe(
    G.ofInterval(10),
    G.take(3),
    G.array
  )
  assert.equal(values.length, 3)
  for (const value of values) {
    assert.ok((value.generatedAt) instanceof Date)
    assert.ok((value.yieldedAt) instanceof Date)
    assert.equal(typeof value.index, 'number')
  }
})
