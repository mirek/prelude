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
