import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('is closing', () => {
  const g = G.range(1, 100)
  assert.deepEqual(G.pipe(g, G.take(3), G.array), [ 1, 2, 3 ])
  assert.deepEqual(G.pipe(g, G.take(3), G.array), [])
})

await test('can be retained', () => {
  const g = G.range(1, 100)
  assert.deepEqual(G.pipe(g, G.retain, G.take(1), G.array), [ 1 ])
  assert.deepEqual(G.pipe(g, G.retain, G.take(2), G.array), [ 2, 3 ])
  assert.deepEqual(G.pipe(g, G.take(2), G.array), [ 4, 5 ])
  assert.deepEqual(G.pipe(g, G.take(3), G.array), [])
})

await test('works on empty', () => {
  const g = G.of([])
  assert.deepEqual(G.pipe(g, G.take(3), G.array), [])
})

await test('works on shorter', () => {
  let g = G.of([ 1, 2 ])
  assert.deepEqual(G.pipe(g, G.take(3), G.array), [ 1, 2 ])
  assert.deepEqual(G.pipe(g, G.take(3), G.array), [])
  g = G.of([ 1, 2 ])
  assert.deepEqual(G.pipe(g, G.retain, G.take(3), G.array), [ 1, 2 ])
  assert.deepEqual(G.pipe(g, G.retain, G.take(3), G.array), [])
})

await test('taking 0 is a bit special', () => {
  const g = G.range(1, 100)
  assert.deepEqual(G.pipe(g, G.take(0), G.array), [])
  assert.deepEqual(G.pipe(g, G.take(1), G.array), [ 1 ])
  assert.deepEqual(G.pipe(g, G.take(1), G.array), [])
})
