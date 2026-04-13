import * as S from './index.js'
import * as Cmp from '@prelude/cmp'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const s =
  <T>(...args: T[]): Set<T> =>
    new Set(args)

const a = s('a', 'b')
const b = s('b', 'c')
const c = s('c', 'd')

await test('empty', () => {
  assert.equal(S.empty(s()), true)
  assert.equal(S.empty(s('a')), false)
})

await test('equal', () => {
  assert.equal(S.equal(s(), s()), true)
  assert.equal(S.equal(s('a'), s()), false)
  assert.equal(S.equal(s(), s('a')), false)
  assert.equal(S.equal(a, s('a', 'b')), true)
  assert.equal(S.equal(a, b), false)
})

await test('union', () => {
  assert.equal(S.equal(s('a', 'b', 'c'), S.union(a, b)), true)
})

await test('intersection', () => {
  assert.equal(S.equal(s('b'), S.intersection(a, b)), true)
  assert.equal(S.equal(s(), S.intersection(a, c)), true)
})

await test('difference', () => {
  assert.equal(S.equal(s('a'), S.difference(a, b)), true)
  assert.equal(S.equal(s('c'), S.difference(b, a)), true)
  assert.equal(S.equal(a, S.difference(a, c)), true)
})

await test('range', () => {
  assert.deepEqual(S.sorted(S.range(3), Cmp.number), [ 0, 1, 2 ])
  assert.deepEqual(S.sorted(S.range(2, 5), Cmp.number), [ 2, 3, 4 ])
  assert.deepEqual(S.sorted(S.range(1, 10, 2), Cmp.number), [ 1, 3, 5, 7, 9 ])
})

await test('range1', () => {
  assert.deepEqual(S.sorted(S.range1(-5, -10), Cmp.number), [ -10, -9, -8, -7, -6, -5 ])
  assert.deepEqual(S.sorted(S.range1(3), Cmp.number), [ 1, 2, 3 ])
  assert.deepEqual(S.sorted(S.range1(2, 5), Cmp.number), [ 2, 3, 4, 5 ])
  assert.deepEqual(S.sorted(S.range1(1, 10, 2), Cmp.number), [ 1, 3, 5, 7, 9 ])
})

await test('disjoint', () => {
  assert.equal(S.disjoint(
    S.of([ 3, 4, 5 ]),
    S.of([ 4 ])
  ), false)
  assert.equal(S.disjoint(
    S.of([ 3, 4, 5 ]),
    S.of([ 6, 0 ])
  ), true)
})
