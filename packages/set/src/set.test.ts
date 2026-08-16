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

await test('range rejects non-positive steps instead of running away', () => {
  for (const step of [ 0, -1, NaN ]) {
    assert.throws(() => S.range(0, 5, step), RangeError)
    assert.throws(() => S.range1(0, 5, step), RangeError)
  }
  assert.deepEqual([ ...S.range(0, 5, 2) ], [ 0, 2, 4 ])
  assert.deepEqual([ ...S.range1(0, 5, 2) ], [ 0, 2, 4 ])
  assert.deepEqual([ ...S.range(5, 0) ], [ 0, 1, 2, 3, 4 ])
})

await test('range and range1 reject non-finite steps', () => {
  // `range` is asserted first: on the unfixed code it returned `{NaN}` instead of throwing, whereas
  // `range1(0, 1, Infinity)` looped forever, so this ordering fails fast instead of hanging.
  assert.throws(() => S.range(0, 1, Infinity), RangeError)
  assert.throws(() => S.range(0, 1, NaN), RangeError)
  assert.throws(() => S.range1(0, 1, Infinity), RangeError)
  assert.throws(() => S.range1(0, 1, NaN), RangeError)
})

await test('range and range1 handle fractional steps without drift', () => {
  assert.deepEqual([ ...S.range1(0, 0.3, 0.1) ], [ 0, 0.1, 0.2, 0.3 ])
  assert.deepEqual([ ...S.range(0, 0.3, 0.1) ], [ 0, 0.1, 0.2 ])
  assert.deepEqual([ ...S.range1(1, 1.3, 0.1) ], [ 1, 1.1, 1.2, 1.3 ])
  assert.deepEqual([ ...S.range(0, 1, 0.25) ], [ 0, 0.25, 0.5, 0.75 ])
  assert.deepEqual([ ...S.range1(0, 1, 0.25) ], [ 0, 0.25, 0.5, 0.75, 1 ])
})

await test('a step below the ulp of the start fails fast instead of stalling', () => {
  // With `i += step` the value never changed and the loop never ended.
  assert.throws(() => S.range(1e6, 1e6 + 1, 1e-12), RangeError)
  assert.throws(() => S.range1(0, 1e9, 1), RangeError)
  assert.equal(S.range(0, 1000).size, 1000)
})

await test('the Readme usage example runs as written', () => {
  const a = new Set([ 3, 1, 2 ])
  assert.deepEqual(S.sorted(a, Cmp.number), [ 1, 2, 3 ])
})

await test('range tolerance is ulp-scale, stays below the interval and never overflows the end', () => {
  // A huge step must not let the start snap across the interval onto the end.
  assert.deepEqual([ ...S.range(0, 1, 1e10) ], [ 0 ])
  assert.deepEqual([ ...S.range1(0, 1, 1e10) ], [ 0 ])
  // Ends that are genuinely (millions of ulps) away from a value are not snapped onto it.
  assert.deepEqual([ ...S.range(0, 1.0000000005, 1) ], [ 0, 1 ])
  assert.deepEqual([ ...S.range(0, 0.9999999995, 1) ], [ 0 ])
  assert.deepEqual([ ...S.range1(0, 1.0000000005, 1) ], [ 0, 1 ])
  assert.deepEqual([ ...S.range1(0, 0.9999999995, 1) ], [ 0 ])
  // ...but rounding error of a few ulps still counts as reaching the end (3 * 0.7 = 2.0999999999999996).
  assert.deepEqual([ ...S.range(0, 2.1, 0.7) ], [ 0, 0.7, 1.4 ])
  assert.deepEqual([ ...S.range1(0, 2.1, 0.7) ], [ 0, 0.7, 1.4, 2.1 ])
  // Asserted last: `max + tolerance` overflowed to Infinity and this looped forever on the unfixed code.
  assert.deepEqual([ ...S.range(0, Number.MAX_VALUE, Number.MAX_VALUE) ], [ 0 ])
  assert.deepEqual([ ...S.range1(0, Number.MAX_VALUE, Number.MAX_VALUE) ], [ 0, Number.MAX_VALUE ])
})
