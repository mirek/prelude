import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('wraps a native array iterator as an iterable generator', () => {
  const gen = G.generator([ 1, 2, 3 ][Symbol.iterator]())
  assert.equal(Symbol.iterator in gen, true)
  assert.equal(gen[Symbol.iterator](), gen)
  assert.deepEqual([ ...gen ], [ 1, 2, 3 ])
})

await test('wraps a map entries iterator', () => {
  const map = new Map([ [ 'a', 1 ], [ 'b', 2 ] ])
  assert.deepEqual([ ...G.generator(map.entries()) ], [ [ 'a', 1 ], [ 'b', 2 ] ])
})

await test('wraps a custom iterator object', () => {
  const iter = {
    value: 0,
    next() {
      return this.value < 3 ?
        { value: this.value++, done: false } :
        { value: undefined, done: true }
    }
  }
  assert.deepEqual([ ...G.generator(iter) ], [ 0, 1, 2 ])
})

await test('lift and of accept bare iterators', () => {
  assert.deepEqual(Array.from(G.lift([ 1, 2 ][Symbol.iterator]())), [ 1, 2 ])
  assert.deepEqual([ ...G.of(new Set([ 'x', 'y' ]).values()) ], [ 'x', 'y' ])
  const iterable = [ 1, 2, 3 ]
  assert.equal(G.lift(iterable), iterable)
})

await test('forwards return to the wrapped iterator', () => {
  const closed: string[] = []
  const source = function* () {
    try {
      yield 1
      yield 2
    } finally {
      closed.push('closed')
    }
  }
  const gen = G.generator(source())
  for (const value of gen) {
    assert.equal(value, 1)
    break
  }
  assert.deepEqual(closed, [ 'closed' ])
})

await test('lift and of accept primitive strings', () => {
  assert.deepEqual([ ...G.lift('abc') ], [ 'a', 'b', 'c' ])
  assert.deepEqual([ ...G.of('ab') ], [ 'a', 'b' ])
})

await test('return and throw exist on a wrapped plain iterator', () => {
  let n = 0
  const iter = { next: () => n < 2 ? { value: n++, done: false } : { value: undefined, done: true } }
  const gen = G.generator(iter)
  assert.deepEqual(gen.next(), { value: 0, done: false })
  assert.deepEqual(gen.return(undefined), { done: true, value: undefined })
  assert.throws(() => gen.throw(new Error('x')), /x/)
  // for-of break calls return(): must not throw.
  const iter2 = { next: () => ({ value: 1, done: false }) }
  for (const value of G.generator(iter2)) {
    assert.equal(value, 1)
    break
  }
})
