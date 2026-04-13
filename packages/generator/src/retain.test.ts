import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('retain', () => {
  const g = G.range(1, 100)
  assert.deepEqual(G.pipe(g, G.retain, G.take(3), G.array), [ 1, 2, 3 ])
  assert.deepEqual(G.pipe(g, G.retain, G.take(3), G.array), [ 4, 5, 6 ])
  assert.deepEqual(G.pipe(g, G.take(3), G.array), [ 7, 8, 9 ])
  assert.deepEqual(G.pipe(g, G.take(3), G.array), [])
})

await test('for', () => {
  const g = G.retain(G.range(1, 5), 2)
  for (const _ of g) {
    break
  }
  for (const _ of g) {
    break
  }
  const values: number[] = []
  for (const value of g) {
    values.push(value)
  }
  assert.deepEqual(values, [ 3, 4, 5 ])
})
