import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('zip', () => {
  assert.deepEqual(G.pipe(G.zip(
    G.range(1, 5),
    [ 'a', 'b', 'c' ]
  ), G.array), [
    [ 1, 'a' ],
    [ 2, 'b' ],
    [ 3, 'c' ]
  ])
})

await test('zip and zipRecord of no inputs are empty', () => {
  assert.deepEqual([ ...G.zip() ], [])
  assert.deepEqual([ ...G.zipRecord({}) ], [])
  assert.deepEqual([ ...G.take(2)(G.zip()) ], [])
})
