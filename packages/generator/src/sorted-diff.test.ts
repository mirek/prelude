import * as G from './index.js'
import * as Cmp from '@prelude/cmp'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('documented example with a subtraction comparator', () => {
  assert.deepEqual(G.pipe([ 1, 3, 5 ], G.sortedDiff([ 2, 3, 4 ], (a, b) => a - b), G.array), [
    [ 1, undefined ], [ undefined, 2 ], [ 3, 3 ], [ undefined, 4 ], [ 5, undefined ]
  ])
  assert.deepEqual(G.pipe([ 1 ], G.sortedDiff([ 5 ], (a, b) => a - b), G.array), [ [ 1, undefined ], [ undefined, 5 ] ])
})

await test('normalised comparators behave the same', () => {
  const subtract = G.pipe([ 1, 3, 5 ], G.sortedDiff([ 2, 3, 4 ], (a, b) => a - b), G.array)
  const signed = G.pipe([ 1, 3, 5 ], G.sortedDiff([ 2, 3, 4 ], Cmp.number), G.array)
  assert.deepEqual(subtract, signed)
})

await test('descending direction', () => {
  assert.deepEqual(G.pipe([ 5, 3, 1 ], G.sortedDiff([ 4, 3, 2 ], (a, b) => b - a, Cmp.asc), G.array), [
    [ 5, undefined ], [ undefined, 4 ], [ 3, 3 ], [ undefined, 2 ], [ 1, undefined ]
  ])
})
