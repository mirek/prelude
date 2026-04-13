import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('simple', () => {
  assert.deepEqual(G.pipe(
    G.range(1, 5),
    G.window(3),
    G.array
  ), [
    [ 1, 2, 3 ],
    [ 2, 3, 4 ],
    [ 3, 4, 5 ]
  ])
  assert.deepEqual(G.pipe(
    G.range(1, 3),
    G.window(3),
    G.array
  ), [
    [ 1, 2, 3 ]
  ])
})

await test('shorter', () => {
  assert.deepEqual(G.pipe(
    G.range(1, 5),
    G.window(6, true),
    G.array
  ), [
    [ 1, 2, 3, 4, 5 ]
  ])
  assert.deepEqual(G.pipe(
    G.range(1, 5),
    G.window(6, false),
    G.array
  ), [
  ])
})
