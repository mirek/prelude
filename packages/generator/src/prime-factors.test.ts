import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const cases: [ n: number, expected: [ number, number ][] ][] = [
  [ 0, [] ],
  [ 42, [ [ 2, 1 ], [ 3, 1 ], [ 7, 1 ] ] ],
  [ 100, [ [ 2, 2 ], [ 5, 2 ] ] ],
  [ Number.MAX_SAFE_INTEGER, [ [ 6361, 1 ], [ 69431, 1 ], [ 20394401, 1 ] ] ]
]

for (const [ n, expected ] of cases) {
  await test(`prime factors of ${n}`, () => {
    assert.deepEqual(G.array(G.primeFactors(n)), expected)
  })
}

await test('a large prime factor does not sieve primes up to itself', () => {
  const start = performance.now()
  assert.deepEqual(G.array(G.primeFactors(3 * 1000000007)), [ [ 3, 1 ], [ 1000000007, 1 ] ])
  assert.deepEqual(G.array(G.primeFactors(15485863)), [ [ 15485863, 1 ] ])
  assert.deepEqual(G.array(G.primeFactors(15485863 * 2)), [ [ 2, 1 ], [ 15485863, 1 ] ])
  assert.deepEqual(G.array(G.primeFactors(49)), [ [ 7, 2 ] ])
  assert.deepEqual(G.array(G.primeFactors(1)), [])
  assert.deepEqual(G.array(G.primeFactors(2)), [ [ 2, 1 ] ])
  assert.ok(performance.now() - start < 2000, 'factoring stayed fast')
})
