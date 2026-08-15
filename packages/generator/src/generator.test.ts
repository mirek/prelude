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
