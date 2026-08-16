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

await test('re-iterable inputs are rotated once', () => {
  assert.deepEqual(G.pipe([ 1, 2, 3 ], G.rotate(1), G.array), [ 2, 3, 1 ])
  assert.deepEqual(G.pipe([ 1, 2, 3, 4, 5 ], G.rotate(2), G.array), [ 3, 4, 5, 1, 2 ])
  assert.deepEqual(G.pipe(new Set([ 1, 2, 3 ]), G.rotate(4), G.array), [ 2, 3, 1 ])
  assert.deepEqual(G.pipe([ 1, 2, 3 ], G.rotate(0), G.array), [ 1, 2, 3 ])
  assert.deepEqual(G.pipe([], G.rotate(2), G.array), [])
})

await test('documented example', () => {
  assert.deepEqual(G.pipe(G.range(1, 5), G.rotate(2), G.array), [ 3, 4, 5, 1, 2 ])
})

await test('closes the source on early break', () => {
  const closed: string[] = []
  const source = function* () {
    try {
      yield* [ 1, 2, 3, 4 ]
    } finally {
      closed.push('closed')
    }
  }
  for (const value of G.rotate(1)(source())) {
    assert.equal(value, 2)
    break
  }
  assert.deepEqual(closed, [ 'closed' ])
})

await test('does not close an exhausted source, closes it on early break', () => {
  const tracked = (throwOnReturn: boolean) => {
    const tracker = {
      returnCalls: 0,
      [Symbol.iterator](): Iterator<number> {
        const iterator = [ 1, 2, 3 ][Symbol.iterator]()
        return {
          next: () => iterator.next(),
          return: () => {
            tracker.returnCalls++
            if (throwOnReturn) {
              throw new Error('return boom')
            }
            return { done: true, value: undefined }
          }
        }
      }
    }
    return tracker
  }
  const full = tracked(false)
  assert.deepEqual([ ...G.rotate(1)(full) ], [ 2, 3, 1 ])
  assert.equal(full.returnCalls, 0)
  assert.deepEqual([ ...G.rotate(1)(tracked(true)) ], [ 2, 3, 1 ])
  assert.deepEqual([ ...G.rotate(5)(tracked(true)) ], [ 3, 1, 2 ])
  const early = tracked(false)
  for (const value of G.rotate(1)(early)) {
    assert.equal(value, 2)
    break
  }
  assert.equal(early.returnCalls, 1)
})
