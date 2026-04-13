import * as RangeSet from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const r = RangeSet.Range.of

await test('intersection (closed, sum)', () => {
  // i: 0 1 2 3
  // a: - - - -
  let a = {
    ranges: [],
    key: RangeSet.Key.closed,
    value: RangeSet.Value.sum
  } as RangeSet.T<number, number>

  // i: 0 1 2 3
  // a: - - - -
  // b: - 1 1 1
  // r: - - - -
  a = RangeSet.intersection(a, { ranges: [r(1, 3, 1)] })
  assert.deepEqual(a.ranges, [])

  // i: 0 1 2 3
  // a: - - - -
  // b: - - - -
  // r: - - - -
  a = RangeSet.intersection(a, { ranges: [] })
  assert.deepEqual(a.ranges, [])
})

await test('intersection (closed, sum) - basic overlap', () => {
  // i: 0 1 2 3 4 5
  // a: - - - - - -
  let a = {
    ranges: [],
    key: RangeSet.Key.closed,
    value: RangeSet.Value.sum
  } as RangeSet.T<number, number>

  // i: 0 1 2 3 4 5
  // a: - - - - - -
  // b: - 3 3 3 - -
  // r: - 3 3 3 - -
  a = RangeSet.union(a, { ranges: [r(1, 3, 3)] })
  assert.deepEqual(a.ranges, [r(1, 3, 3)])

  // i: 0 1 2 3 4 5
  // a: - 3 3 3 - -
  // b: - - 2 2 2 -
  // r: - - 5 5 - -
  a = RangeSet.intersection(a, { ranges: [r(2, 4, 2)] })
  assert.deepEqual(a.ranges, [r(2, 3, 5)])
})

await test('intersection (closed, sum) - no overlap', () => {
  // i: 0 1 2 3 4 5
  // a: - - - - - -
  let a = {
    ranges: [],
    key: RangeSet.Key.closed,
    value: RangeSet.Value.sum
  } as RangeSet.T<number, number>

  // i: 0 1 2 3 4 5
  // a: - - - - - -
  // b: - 5 5 - - -
  // r: - 5 5 - - -
  a = RangeSet.union(a, { ranges: [r(1, 2, 5)] })
  assert.deepEqual(a.ranges, [r(1, 2, 5)])

  // i: 0 1 2 3 4 5
  // a: - 5 5 - - -
  // b: - - - - 7 7
  // r: - - - - - -
  a = RangeSet.intersection(a, { ranges: [r(4, 5, 7)] })
  assert.deepEqual(a.ranges, [])
})

await test('intersection (closed, sum) - adjacent ranges', () => {
  // i: 0 1 2 3 4 5
  // a: - - - - - -
  let a = {
    ranges: [],
    key: RangeSet.Key.closed,
    value: RangeSet.Value.sum
  } as RangeSet.T<number, number>

  // i: 0 1 2 3 4 5
  // a: - - - - - -
  // b: - 4 4 - - -
  // r: - 4 4 - - -
  a = RangeSet.union(a, { ranges: [r(1, 2, 4)] })
  assert.deepEqual(a.ranges, [r(1, 2, 4)])

  // i: 0 1 2 3 4 5
  // a: - 4 4 - - -
  // b: - - - 6 6 -
  // r: - - - - - -
  a = RangeSet.intersection(a, { ranges: [r(3, 4, 6)] })
  assert.deepEqual(a.ranges, [])
})

await test('intersection (closed, sum) - complete overlap', () => {
  // i: 0 1 2 3 4 5
  // a: - - - - - -
  let a = {
    ranges: [],
    key: RangeSet.Key.closed,
    value: RangeSet.Value.sum
  } as RangeSet.T<number, number>

  // i: 0 1 2 3 4 5
  // a: - - - - - -
  // b: - 2 2 2 2 -
  // r: - 2 2 2 2 -
  a = RangeSet.union(a, { ranges: [r(1, 4, 2)] })
  assert.deepEqual(a.ranges, [r(1, 4, 2)])

  // i: 0 1 2 3 4 5
  // a: - 2 2 2 2 -
  // b: - 3 3 3 3 -
  // r: - 5 5 5 5 -
  a = RangeSet.intersection(a, { ranges: [r(1, 4, 3)] })
  assert.deepEqual(a.ranges, [r(1, 4, 5)])
})

await test('intersection (closed, sum) - partial overlap at start', () => {
  // i: 0 1 2 3 4 5
  // a: - - - - - -
  let a = {
    ranges: [],
    key: RangeSet.Key.closed,
    value: RangeSet.Value.sum
  } as RangeSet.T<number, number>

  // i: 0 1 2 3 4 5
  // a: - - - - - -
  // b: - - 4 4 4 -
  // r: - - 4 4 4 -
  a = RangeSet.union(a, { ranges: [r(2, 4, 4)] })
  assert.deepEqual(a.ranges, [r(2, 4, 4)])

  // i: 0 1 2 3 4 5
  // a: - - 4 4 4 -
  // b: - 1 1 1 - -
  // r: - - 5 5 - -
  a = RangeSet.intersection(a, { ranges: [r(1, 3, 1)] })
  assert.deepEqual(a.ranges, [r(2, 3, 5)])
})

await test('intersection (closed, sum) - partial overlap at end', () => {
  // i: 0 1 2 3 4 5
  // a: - - - - - -
  let a = {
    ranges: [],
    key: RangeSet.Key.closed,
    value: RangeSet.Value.sum
  } as RangeSet.T<number, number>

  // i: 0 1 2 3 4 5
  // a: - - - - - -
  // b: - 6 6 6 - -
  // r: - 6 6 6 - -
  a = RangeSet.union(a, { ranges: [r(1, 3, 6)] })
  assert.deepEqual(a.ranges, [r(1, 3, 6)])

  // i: 0 1 2 3 4 5
  // a: - 6 6 6 - -
  // b: - - - 2 2 2
  // r: - - - 8 - -
  a = RangeSet.intersection(a, { ranges: [r(3, 5, 2)] })
  assert.deepEqual(a.ranges, [r(3, 3, 8)])
})

await test('intersection (closed, sum) - multiple ranges', () => {
  // i: 0 1 2 3 4 5 6 7
  // a: - - - - - - - -
  let a = {
    ranges: [],
    key: RangeSet.Key.closed,
    value: RangeSet.Value.sum
  } as RangeSet.T<number, number>

  // i: 0 1 2 3 4 5 6 7
  // a: - - - - - - - -
  // b: - 1 1 - - 3 3 -
  // r: - 1 1 - - 3 3 -
  a = RangeSet.union(a, { ranges: [r(1, 2, 1), r(5, 6, 3)] })
  assert.deepEqual(a.ranges, [r(1, 2, 1), r(5, 6, 3)])

  // i: 0 1 2 3 4 5 6 7
  // a: - 1 1 - - 3 3 -
  // b: - - 2 2 2 2 - -
  // r: - - 3 - - 5 - -
  a = RangeSet.intersection(a, { ranges: [r(2, 5, 2)] })
  assert.deepEqual(a.ranges, [r(2, 2, 3), r(5, 5, 5)])
})

await test('intersection (closed, sum) - single point ranges', () => {
  // i: 0 1 2 3 4 5
  // a: - - - - - -
  let a = {
    ranges: [],
    key: RangeSet.Key.closed,
    value: RangeSet.Value.sum
  } as RangeSet.T<number, number>

  // i: 0 1 2 3 4 5
  // a: - - - - - -
  // b: - 9 - - - -
  // r: - 9 - - - -
  a = RangeSet.union(a, { ranges: [r(1, 1, 9)] })
  assert.deepEqual(a.ranges, [r(1, 1, 9)])

  // i: 0 1 2 3 4 5
  // a: - 9 - - - -
  // b: - 4 - - - -
  // r: - 13 - - - -
  a = RangeSet.intersection(a, { ranges: [r(1, 1, 4)] })
  assert.deepEqual(a.ranges, [r(1, 1, 13)])
})

await test('intersection (closed, sum) - single point no overlap', () => {
  // i: 0 1 2 3 4 5
  // a: - - - - - -
  let a = {
    ranges: [],
    key: RangeSet.Key.closed,
    value: RangeSet.Value.sum
  } as RangeSet.T<number, number>

  // i: 0 1 2 3 4 5
  // a: - - - - - -
  // b: - 7 - - - -
  // r: - 7 - - - -
  a = RangeSet.union(a, { ranges: [r(1, 1, 7)] })
  assert.deepEqual(a.ranges, [r(1, 1, 7)])

  // i: 0 1 2 3 4 5
  // a: - 7 - - - -
  // b: - - - 5 - -
  // r: - - - - - -
  a = RangeSet.intersection(a, { ranges: [r(3, 3, 5)] })
  assert.deepEqual(a.ranges, [])
})

await test('intersection (closed, sum) - range with single point', () => {
  // i: 0 1 2 3 4 5
  // a: - - - - - -
  let a = {
    ranges: [],
    key: RangeSet.Key.closed,
    value: RangeSet.Value.sum
  } as RangeSet.T<number, number>

  // i: 0 1 2 3 4 5
  // a: - - - - - -
  // b: - 3 3 3 3 -
  // r: - 3 3 3 3 -
  a = RangeSet.union(a, { ranges: [r(1, 4, 3)] })
  assert.deepEqual(a.ranges, [r(1, 4, 3)])

  // i: 0 1 2 3 4 5
  // a: - 3 3 3 3 -
  // b: - - - 8 - -
  // r: - - - 11 - -
  a = RangeSet.intersection(a, { ranges: [r(3, 3, 8)] })
  assert.deepEqual(a.ranges, [r(3, 3, 11)])
})

await test('intersection (closed, sum) - empty sets', () => {
  // i: 0 1 2 3
  // a: - - - -
  let a = {
    ranges: [],
    key: RangeSet.Key.closed,
    value: RangeSet.Value.sum
  } as RangeSet.T<number, number>

  // i: 0 1 2 3
  // a: - - - -
  // b: - - - -
  // r: - - - -
  a = RangeSet.intersection(a, { ranges: [] })
  assert.deepEqual(a.ranges, [])
})

await test('intersection (closed, sum) - one empty set', () => {
  // i: 0 1 2 3 4 5
  // a: - - - - - -
  let a = {
    ranges: [],
    key: RangeSet.Key.closed,
    value: RangeSet.Value.sum
  } as RangeSet.T<number, number>

  // i: 0 1 2 3 4 5
  // a: - - - - - -
  // b: - 2 2 2 - -
  // r: - 2 2 2 - -
  a = RangeSet.union(a, { ranges: [r(1, 3, 2)] })
  assert.deepEqual(a.ranges, [r(1, 3, 2)])

  // i: 0 1 2 3 4 5
  // a: - 2 2 2 - -
  // b: - - - - - -
  // r: - - - - - -
  a = RangeSet.intersection(a, { ranges: [] })
  assert.deepEqual(a.ranges, [])
})

await test('intersection (closed, sum) - complex overlapping', () => {
  // i: 0 1 2 3 4 5 6 7 8 9
  // a: - - - - - - - - - -
  let a = {
    ranges: [],
    key: RangeSet.Key.closed,
    value: RangeSet.Value.sum
  } as RangeSet.T<number, number>

  // i: 0 1 2 3 4 5 6 7 8 9
  // a: - - - - - - - - - -
  // b: - 1 1 1 - - 2 2 2 -
  // r: - 1 1 1 - - 2 2 2 -
  a = RangeSet.union(a, { ranges: [r(1, 3, 1), r(6, 8, 2)] })
  assert.deepEqual(a.ranges, [r(1, 3, 1), r(6, 8, 2)])

  // i: 0 1 2 3 4 5 6 7 8 9
  // a: - 1 1 1 - - 2 2 2 -
  // b: - - 3 3 3 3 3 3 - -
  // r: - - 4 4 - - 5 5 - -
  a = RangeSet.intersection(a, { ranges: [r(2, 7, 3)] })
  assert.deepEqual(a.ranges, [r(2, 3, 4), r(6, 7, 5)])
})

await test('intersection (closed, min)', () => {
  // i: 0 1 2 3 4 5
  // a: - - - - - -
  let a = {
    ranges: [],
    key: RangeSet.Key.closed,
    value: RangeSet.Value.min
  } as RangeSet.T<number, number>

  // i: 0 1 2 3 4 5
  // a: - - - - - -
  // b: - 8 8 8 - -
  // r: - 8 8 8 - -
  a = RangeSet.union(a, { ranges: [r(1, 3, 8)] })
  assert.deepEqual(a.ranges, [r(1, 3, 8)])

  // i: 0 1 2 3 4 5
  // a: - 8 8 8 - -
  // b: - - 5 5 5 -
  // r: - - 5 5 - -
  a = RangeSet.intersection(a, { ranges: [r(2, 4, 5)] })
  assert.deepEqual(a.ranges, [r(2, 3, 5)])
})