import { test, expect } from '@jest/globals'
import * as RangeSet from './index.js'

const r = RangeSet.Range.of

test('union (closed, sum)', () => {
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
  // r: - 1 1 1
  a = RangeSet.union(a, { ranges: [r(1, 3, 1)] })
  expect(a.ranges).toEqual([r(1, 3, 1)])

  // i: 0 1 2 3
  // a: - 1 1 1
  // b: 2 2 - -
  // r: 2 3 1 1
  a = RangeSet.union(a, { ranges: [r(0, 1, 2)] })
  expect(a.ranges).toEqual([r(0, 0, 2), r(1, 1, 3), r(2, 3, 1)])
})

test('union (closed, sum) - overlapping ranges', () => {
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
  expect(a.ranges).toEqual([r(1, 3, 3)])

  // i: 0 1 2 3 4 5
  // a: - 3 3 3 - -
  // b: - - 2 2 2 -
  // r: - 3 5 5 2 -
  a = RangeSet.union(a, { ranges: [r(2, 4, 2)] })
  expect(a.ranges).toEqual([r(1, 1, 3), r(2, 3, 5), r(4, 4, 2)])
})

test('union (closed, sum) - adjacent ranges same value', () => {
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
  expect(a.ranges).toEqual([r(1, 2, 5)])

  // i: 0 1 2 3 4 5
  // a: - 5 5 - - -
  // b: - - - 5 5 -
  // r: - 5 5 5 5 -
  a = RangeSet.union(a, { ranges: [r(3, 4, 5)] })
  expect(a.ranges).toEqual([r(1, 4, 5)])
})

test('union (closed, sum) - adjacent ranges different values', () => {
  // i: 0 1 2 3 4 5
  // a: - - - - - -
  let a = {
    ranges: [],
    key: RangeSet.Key.closed,
    value: RangeSet.Value.sum
  } as RangeSet.T<number, number>

  // i: 0 1 2 3 4 5
  // a: - - - - - -
  // b: - 3 3 - - -
  // r: - 3 3 - - -
  a = RangeSet.union(a, { ranges: [r(1, 2, 3)] })
  expect(a.ranges).toEqual([r(1, 2, 3)])

  // i: 0 1 2 3 4 5
  // a: - 3 3 - - -
  // b: - - - 7 7 -
  // r: - 3 3 7 7 -
  a = RangeSet.union(a, { ranges: [r(3, 4, 7)] })
  expect(a.ranges).toEqual([r(1, 2, 3), r(3, 4, 7)])
})

test('union (closed, sum) - multiple ranges at once', () => {
  // i: 0 1 2 3 4 5 6 7
  // a: - - - - - - - -
  let a = {
    ranges: [],
    key: RangeSet.Key.closed,
    value: RangeSet.Value.sum
  } as RangeSet.T<number, number>

  // i: 0 1 2 3 4 5 6 7
  // a: - - - - - - - -
  // b: - 1 - - 2 2 - 3
  // r: - 1 - - 2 2 - 3
  a = RangeSet.union(a, { ranges: [r(1, 1, 1), r(4, 5, 2), r(7, 7, 3)] })
  expect(a.ranges).toEqual([r(1, 1, 1), r(4, 5, 2), r(7, 7, 3)])
})

test('union (closed, sum) - complete overlap', () => {
  // i: 0 1 2 3 4 5
  // a: - - - - - -
  let a = {
    ranges: [],
    key: RangeSet.Key.closed,
    value: RangeSet.Value.sum
  } as RangeSet.T<number, number>

  // i: 0 1 2 3 4 5
  // a: - - - - - -
  // b: - 4 4 4 4 -
  // r: - 4 4 4 4 -
  a = RangeSet.union(a, { ranges: [r(1, 4, 4)] })
  expect(a.ranges).toEqual([r(1, 4, 4)])

  // i: 0 1 2 3 4 5
  // a: - 4 4 4 4 -
  // b: - 3 3 3 3 -
  // r: - 7 7 7 7 -
  a = RangeSet.union(a, { ranges: [r(1, 4, 3)] })
  expect(a.ranges).toEqual([r(1, 4, 7)])
})

test('union (closed, sum) - partial overlap at start', () => {
  // i: 0 1 2 3 4 5
  // a: - - - - - -
  let a = {
    ranges: [],
    key: RangeSet.Key.closed,
    value: RangeSet.Value.sum
  } as RangeSet.T<number, number>

  // i: 0 1 2 3 4 5
  // a: - - - - - -
  // b: - - 5 5 5 -
  // r: - - 5 5 5 -
  a = RangeSet.union(a, { ranges: [r(2, 4, 5)] })
  expect(a.ranges).toEqual([r(2, 4, 5)])

  // i: 0 1 2 3 4 5
  // a: - - 5 5 5 -
  // b: - 2 2 2 - -
  // r: - 2 7 7 5 -
  a = RangeSet.union(a, { ranges: [r(1, 3, 2)] })
  expect(a.ranges).toEqual([r(1, 1, 2), r(2, 3, 7), r(4, 4, 5)])
})

test('union (closed, sum) - partial overlap at end', () => {
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
  expect(a.ranges).toEqual([r(1, 3, 3)])

  // i: 0 1 2 3 4 5
  // a: - 3 3 3 - -
  // b: - - - 1 1 1
  // r: - 3 3 4 1 1
  a = RangeSet.union(a, { ranges: [r(3, 5, 1)] })
  expect(a.ranges).toEqual([r(1, 2, 3), r(3, 3, 4), r(4, 5, 1)])
})

test('union (closed, max)', () => {
  // i: 0 1 2 3 4 5
  // a: - - - - - -
  let a = {
    ranges: [],
    key: RangeSet.Key.closed,
    value: RangeSet.Value.max
  } as RangeSet.T<number, number>

  // i: 0 1 2 3 4 5
  // a: - - - - - -
  // b: - 3 3 3 - -
  // r: - 3 3 3 - -
  a = RangeSet.union(a, { ranges: [r(1, 3, 3)] })
  expect(a.ranges).toEqual([r(1, 3, 3)])

  // i: 0 1 2 3 4 5
  // a: - 3 3 3 - -
  // b: - - 5 5 5 -
  // r: - 3 5 5 5 -
  a = RangeSet.union(a, { ranges: [r(2, 4, 5)] })
  expect(a.ranges).toEqual([r(1, 1, 3), r(2, 3, 5), r(4, 4, 5)])
})

test('union (closed, min)', () => {
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
  expect(a.ranges).toEqual([r(1, 3, 8)])

  // i: 0 1 2 3 4 5
  // a: - 8 8 8 - -
  // b: - - 5 5 5 -
  // r: - 8 5 5 5 -
  a = RangeSet.union(a, { ranges: [r(2, 4, 5)] })
  expect(a.ranges).toEqual([r(1, 1, 8), r(2, 3, 5), r(4, 4, 5)])
})

test('union (closed, sum) - empty range set', () => {
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
  a = RangeSet.union(a, { ranges: [] })
  expect(a.ranges).toEqual([])
})

test('union (closed, sum) - single point ranges', () => {
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
  expect(a.ranges).toEqual([r(1, 1, 7)])

  // i: 0 1 2 3 4 5
  // a: - 7 - - - -
  // b: - - - 4 - -
  // r: - 7 - 4 - -
  a = RangeSet.union(a, { ranges: [r(3, 3, 4)] })
  expect(a.ranges).toEqual([r(1, 1, 7), r(3, 3, 4)])

  // i: 0 1 2 3 4 5
  // a: - 7 - 4 - -
  // b: - - 2 - - -
  // r: - 7 2 4 - -
  a = RangeSet.union(a, { ranges: [r(2, 2, 2)] })
  expect(a.ranges).toEqual([r(1, 1, 7), r(2, 2, 2), r(3, 3, 4)])
})

test('union (closed, sum) - overlapping single points', () => {
  // i: 0 1 2 3
  // a: - - - -
  let a = {
    ranges: [],
    key: RangeSet.Key.closed,
    value: RangeSet.Value.sum
  } as RangeSet.T<number, number>

  // i: 0 1 2 3
  // a: - - - -
  // b: - 5 - -
  // r: - 5 - -
  a = RangeSet.union(a, { ranges: [r(1, 1, 5)] })
  expect(a.ranges).toEqual([r(1, 1, 5)])

  // i: 0 1 2 3
  // a: - 5 - -
  // b: - 3 - -
  // r: - 8 - -
  a = RangeSet.union(a, { ranges: [r(1, 1, 3)] })
  expect(a.ranges).toEqual([r(1, 1, 8)])
})

test('union (closed, sum) - large gaps', () => {
  // i: 0 1 2 3 4 5 6 7 8 9 10
  // a: - - - - - - - - - - --
  let a = {
    ranges: [],
    key: RangeSet.Key.closed,
    value: RangeSet.Value.sum
  } as RangeSet.T<number, number>

  // i: 0 1 2 3 4 5 6 7 8 9 10
  // a: - - - - - - - - - - --
  // b: - 1 - - - - - - - 9 --
  // r: - 1 - - - - - - - 9 --
  a = RangeSet.union(a, { ranges: [r(1, 1, 1), r(9, 9, 9)] })
  expect(a.ranges).toEqual([r(1, 1, 1), r(9, 9, 9)])

  // i: 0 1 2 3 4 5 6 7 8 9 10
  // a: - 1 - - - - - - - 9 --
  // b: - - - - - 5 5 5 - - --
  // r: - 1 - - - 5 5 5 - 9 --
  a = RangeSet.union(a, { ranges: [r(5, 7, 5)] })
  expect(a.ranges).toEqual([r(1, 1, 1), r(5, 7, 5), r(9, 9, 9)])
})

test('union (closed, sum) - filling gaps', () => {
  // i: 0 1 2 3 4 5
  // a: - - - - - -
  let a = {
    ranges: [],
    key: RangeSet.Key.closed,
    value: RangeSet.Value.sum
  } as RangeSet.T<number, number>

  // i: 0 1 2 3 4 5
  // a: - - - - - -
  // b: - 2 - - 2 -
  // r: - 2 - - 2 -
  a = RangeSet.union(a, { ranges: [r(1, 1, 2), r(4, 4, 2)] })
  expect(a.ranges).toEqual([r(1, 1, 2), r(4, 4, 2)])

  // i: 0 1 2 3 4 5
  // a: - 2 - - 2 -
  // b: - - 2 2 - -  
  // r: - 2 2 2 2 -
  a = RangeSet.union(a, { ranges: [r(2, 3, 2)] })
  expect(a.ranges).toEqual([r(1, 4, 2)])
})
