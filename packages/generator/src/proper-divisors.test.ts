import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const t =
  (n: number, ds: number[]) =>
    assert.deepEqual(G.pipe(
      G.properDivisors(n),
      G.array
    ), ds)

await test('simple', () => {
  t(0, [])
  t(1, [])
  t(2, [1])
  t(3, [1])
  t(4, [1, 2])
  t(28, [1, 2, 4, 7, 14])
})

await test('divisors are yielded in ascending order', () => {
  t(12, [ 1, 2, 3, 4, 6 ])
  t(30, [ 1, 2, 3, 5, 6, 10, 15 ])
  t(36, [ 1, 2, 3, 4, 6, 9, 12, 18 ])
  t(360, [ 1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36, 40, 45, 60, 72, 90, 120, 180 ])
})
