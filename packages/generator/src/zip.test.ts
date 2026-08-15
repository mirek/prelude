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

await test('later sources are not advanced once an earlier one is exhausted', () => {
  const rest = [ 1, 2, 3 ][Symbol.iterator]()
  assert.deepEqual([ ...G.zip([ 'a' ], rest) ], [ [ 'a', 1 ] ])
  assert.deepEqual(rest.next(), { done: false, value: 2 })
  const rest2 = [ 1, 2, 3 ][Symbol.iterator]()
  assert.deepEqual([ ...G.zipRecord({ a: [ 'a' ], b: rest2 }) ], [ { a: 'a', b: 1 } ])
  assert.deepEqual(rest2.next(), { done: false, value: 2 })
  const rest3 = [ 1, 2, 3 ][Symbol.iterator]()
  assert.deepEqual([ ...G.pair(rest3)([ 'a' ]) ], [ [ 'a', 1 ] ])
  assert.deepEqual(rest3.next(), { done: false, value: 2 })
})
