import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const rotate =
  (n: number, xs = [ 1, 2, 3 ]) =>
    G.pipe(G.of(xs), G.rotate(n), G.array)

await test('simple', () => {
  assert.deepEqual(rotate(1), [ 2, 3, 1 ])
})

await test('larger', () => {
  assert.deepEqual(rotate(0), [ 1, 2, 3 ])
  assert.deepEqual(rotate(1), [ 2, 3, 1 ])
  assert.deepEqual(rotate(2), [ 3, 1, 2 ])
  assert.deepEqual(rotate(3), [ 1, 2, 3 ])
  assert.deepEqual(rotate(4), [ 2, 3, 1 ])
  assert.deepEqual(rotate(5), [ 3, 1, 2 ])
  assert.deepEqual(rotate(6), [ 1, 2, 3 ])
  assert.deepEqual(rotate(7), [ 2, 3, 1 ])
})

await test('empty', () => {
  assert.deepEqual(rotate(0, []), [])
  assert.deepEqual(rotate(1, []), [])
  assert.deepEqual(rotate(2, []), [])
})

await test('negative', () => {
  assert.deepEqual(rotate(-1), [ 3, 1, 2 ])
  assert.deepEqual(rotate(-2), [ 2, 3, 1 ])
  assert.deepEqual(rotate(-3), [ 1, 2, 3 ])
  assert.deepEqual(rotate(-4), [ 3, 1, 2 ])
})
