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

await test('extreme closes its source when the comparator throws', () => {
  const closed: string[] = []
  assert.throws(() => G.extreme(() => { throw new Error('cmp boom') })(source('s', closed)()), /cmp boom/)
  assert.deepEqual(closed, [ 's' ])
})

/** An iterable whose iterator counts `return()` calls and, optionally, throws from `return()` or `next()`. */
const tracked =
  <T>(values: T[], options: { throwOnReturn?: boolean, throwOnNext?: boolean } = {}) => {
    const tracker = {
      returnCalls: 0,
      [Symbol.iterator](): Iterator<T> {
        const iterator = values[Symbol.iterator]()
        return {
          next: () => {
            if (options.throwOnNext) {
              throw new Error('next boom')
            }
            return iterator.next()
          },
          return: () => {
            tracker.returnCalls++
            if (options.throwOnReturn) {
              throw new Error('return boom')
            }
            return { done: true, value: undefined }
          }
        }
      }
    }
    return tracker
  }

await test('exhausted sources are not closed again on normal completion, unexhausted ones are', () => {
  const short = tracked([ 1 ])
  const long = tracked([ 1, 2, 3 ])
  assert.deepEqual([ ...G.zip(short, long) ], [ [ 1, 1 ] ])
  assert.equal(short.returnCalls, 0)
  assert.equal(long.returnCalls, 1)
  const short2 = tracked([ 1 ])
  const long2 = tracked([ 1, 2, 3 ])
  assert.deepEqual([ ...G.zipRecord({ a: long2, b: short2 }) ], [ { a: 1, b: 1 } ])
  assert.equal(short2.returnCalls, 0)
  assert.equal(long2.returnCalls, 1)
  const short3 = tracked([ 1 ])
  const long3 = tracked([ 1, 2, 3 ])
  assert.deepEqual([ ...G.interleave(short3, long3) ], [ 1, 1 ])
  assert.equal(short3.returnCalls, 0)
  assert.equal(long3.returnCalls, 1)
  const lhs = tracked([ 1, 2, 3 ])
  const rhs = tracked([ 1 ])
  assert.deepEqual([ ...G.pair(rhs)(lhs) ], [ [ 1, 1 ] ])
  assert.equal(lhs.returnCalls, 1)
  assert.equal(rhs.returnCalls, 0)
  const l = tracked([ 1, 3 ])
  const r = tracked([ 2 ])
  assert.deepEqual([ ...G.sortedDiff(r, (a: number, b: number) => a - b)(l) ], [ [ 1, undefined ], [ undefined, 2 ], [ 3, undefined ] ])
  assert.equal(l.returnCalls, 0)
  assert.equal(r.returnCalls, 0)
})

await test('a throwing return() on the exhausted source does not fail normal completion', () => {
  assert.deepEqual([ ...G.zip(tracked([ 1, 2 ], { throwOnReturn: true }), [ 1, 2 ]) ], [ [ 1, 1 ], [ 2, 2 ] ])
  assert.deepEqual([ ...G.zipRecord({ a: tracked([ 1 ], { throwOnReturn: true }), b: [ 2 ] }) ], [ { a: 1, b: 2 } ])
  assert.deepEqual([ ...G.interleave(tracked([ 1 ], { throwOnReturn: true }), [ 2 ]) ], [ 1, 2 ])
  assert.deepEqual([ ...G.pair([ 2 ])(tracked([ 1 ], { throwOnReturn: true })) ], [ [ 1, 2 ] ])
  assert.deepEqual([ ...G.sortedDiff(tracked([ 2 ], { throwOnReturn: true }), (a: number, b: number) => a - b)(tracked([ 1 ], { throwOnReturn: true })) ], [ [ 1, undefined ], [ undefined, 2 ] ])
})

await test('a throwing return() propagates on consumer break', () => {
  assert.throws(() => breakAfterFirst(G.zip(tracked([ 1, 2 ], { throwOnReturn: true }), [ 1, 2 ])), /return boom/)
  assert.throws(() => breakAfterFirst(G.interleave(tracked([ 1, 2 ], { throwOnReturn: true }), [ 1, 2 ])), /return boom/)
})

await test('a throwing return() does not mask an in-flight error', () => {
  const failing = tracked([ 1, 2 ], { throwOnReturn: true })
  const broken = tracked([ 1, 2 ], { throwOnNext: true })
  assert.throws(() => [ ...G.zip(failing, broken) ], /next boom/)
  assert.equal(failing.returnCalls, 1)
  const g = G.interleave(tracked([ 1, 2 ], { throwOnReturn: true }), [ 3, 4 ])
  assert.deepEqual(g.next(), { done: false, value: 1 })
  assert.throws(() => g.throw(new Error('injected')), /injected/)
  const g2 = G.zipRecord({ a: tracked([ 1, 2 ], { throwOnReturn: true }), b: [ 3, 4 ] })
  assert.deepEqual(g2.next(), { done: false, value: { a: 1, b: 3 } })
  assert.throws(() => g2.throw(new Error('injected')), /injected/)
})
