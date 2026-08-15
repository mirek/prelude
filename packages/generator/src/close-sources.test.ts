import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

/** A source generator that records when it is closed. */
const source =
  (name: string, closed: string[], values = [ 1, 2, 3, 4 ]) =>
    function* () {
      try {
        yield* values
      } finally {
        closed.push(name)
      }
    }

const breakAfterFirst = <T>(iterable: Iterable<T>) => {
  for (const _ of iterable) {
    break
  }
}

await test('pair, zip, zipRecord, interleave and sortedDiff close their sources when the consumer breaks', () => {
  const closed: string[] = []
  breakAfterFirst(G.pair(source('rhs', closed)())(source('lhs', closed)()))
  breakAfterFirst(G.zip(source('a', closed)(), source('b', closed)()))
  breakAfterFirst(G.zipRecord({ x: source('x', closed)(), y: source('y', closed)() }))
  breakAfterFirst(G.interleave(source('i', closed)(), source('j', closed)()))
  breakAfterFirst(G.sortedDiff(source('r', closed)(), (a: number, b: number) => a < b ? -1 : a > b ? 1 : 0)(source('l', closed)()))
  assert.deepEqual(closed.toSorted(), [ 'a', 'b', 'i', 'j', 'l', 'lhs', 'r', 'rhs', 'x', 'y' ])
})

await test('sources are also closed on normal completion', () => {
  const closed: string[] = []
  assert.deepEqual([ ...G.zip(source('a', closed, [ 1 ])(), source('b', closed)()) ], [ [ 1, 1 ] ])
  assert.deepEqual([ ...G.pair(source('rhs', closed, [ 1 ])())(source('lhs', closed)()) ], [ [ 1, 1 ] ])
  assert.deepEqual([ ...G.sortedDiff(source('r', closed, [ 2 ])(), (a: number, b: number) => a < b ? -1 : a > b ? 1 : 0)(source('l', closed, [ 1 ])()) ], [ [ 1, undefined ], [ undefined, 2 ] ])
  assert.deepEqual(closed.toSorted(), [ 'a', 'b', 'l', 'lhs', 'r', 'rhs' ])
})
