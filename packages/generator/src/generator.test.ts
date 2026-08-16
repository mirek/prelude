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

await test('wraps a frozen iterator', () => {
  let n = 0
  const iter = Object.freeze({ next: () => n < 3 ? { value: n++, done: false } : { value: undefined, done: true } })
  assert.deepEqual([ ...G.generator(iter) ], [ 0, 1, 2 ])
})

await test('wraps an iterator with a non-configurable next', () => {
  let n = 0
  const iter = Object.defineProperty({}, 'next', {
    value: () => n < 2 ? { value: n++, done: false } : { value: undefined, done: true },
    writable: false,
    configurable: false
  }) as Iterator<number>
  const gen = G.generator(iter)
  assert.deepEqual(gen.next(), { value: 0, done: false })
  assert.deepEqual([ ...gen ], [ 1 ])
})

await test('stays closed after a synthesized return', () => {
  let n = 0
  // Bounded source: on a wrapper that forgets it was closed, spread terminates instead of hanging.
  const gen = G.generator({ next: () => n < 5 ? { value: n++, done: false } : { value: undefined, done: true } })
  assert.deepEqual(gen.next(), { value: 0, done: false })
  assert.deepEqual(gen.return(undefined), { done: true, value: undefined })
  assert.deepEqual(gen.next(), { done: true, value: undefined })
  assert.deepEqual([ ...gen ], [])
})

await test('stays closed after a for-of break', () => {
  let n = 0
  const gen = G.generator({ next: () => n < 5 ? { value: n++, done: false } : { value: undefined, done: true } })
  for (const value of gen) {
    assert.equal(value, 0)
    break
  }
  assert.deepEqual([ ...gen ], [])
})

await test('stays closed after a synthesized throw', () => {
  let n = 0
  const gen = G.generator({ next: () => ({ value: n++, done: false }) })
  assert.throws(() => gen.throw(new Error('boom')), /boom/)
  assert.deepEqual(gen.next(), { done: true, value: undefined })
})

await test('stays closed after the wrapped iterator finishes its own return', () => {
  let n = 0
  const iter = {
    next: () => ({ value: n++, done: false }),
    return: (value?: unknown) => ({ done: true as const, value: value as number })
  }
  const gen = G.generator(iter)
  assert.deepEqual(gen.next(), { value: 0, done: false })
  assert.deepEqual(gen.return(7), { done: true, value: 7 })
  assert.deepEqual(gen.next(), { done: true, value: undefined })
})

await test('wrapped iterators keep Symbol.iterator and the iterator helpers', () => {
  const gen = G.generator([1, 2, 3][Symbol.iterator]())
  assert.equal(gen[Symbol.iterator](), gen)
  assert.deepEqual(gen.map(x => x * 2).toArray(), [2, 4, 6])
})
