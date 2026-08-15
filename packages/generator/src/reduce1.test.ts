import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('reduces a generator using the first element as the seed', () => {
  assert.equal(G.pipe(G.range(1, 5), G.reduce1((a, b) => a + b)), 15)
})

await test('does not repeat the first element of re-iterable inputs', () => {
  assert.equal(G.reduce1((a: number, b: number) => a + b)([ 1, 2, 3 ]), 6)
  assert.equal(G.reduce1((a: number, b: number) => a + b)(new Set([ 1, 2, 3 ])), 6)
  assert.deepEqual(G.reduce1((a: string, b: string) => a + b)([ 'a', 'b', 'c' ]), 'abc')
})

await test('passes the index of the reduced element', () => {
  const indices: number[] = []
  G.reduce1((a: number, b: number, index: number) => {
    indices.push(index)
    return a + b
  })([ 10, 20, 30 ])
  assert.deepEqual(indices, [ 1, 2 ])
})

await test('throws on empty input', () => {
  assert.throws(() => G.reduce1((a: number, b: number) => a + b)([]), /empty/)
})
