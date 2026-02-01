import { test, expect } from '@jest/globals'
import * as RangeSet from './index.js'

const r = RangeSet.Range.of

test('difference (closed, sum)', () => {
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
  a = RangeSet.difference(a, { ranges: [r(1, 3, 1)] })
  expect(a.ranges).toEqual([])

  // i: 0 1 2 3
  // a: - - - -
  // b: - - - -
  // r: - - - -
  a = RangeSet.difference(a, { ranges: [] })
  expect(a.ranges).toEqual([])
})

test('difference (closed, sum) - basic subtraction', () => {
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
  expect(a.ranges).toEqual([r(1, 4, 3)])

  // i: 0 1 2 3 4 5
  // a: - 3 3 3 3 -
  // b: - - 2 2 - -
  // r: - 3 - - 3 -
  a = RangeSet.difference(a, { ranges: [r(2, 3, 2)] })
  expect(a.ranges).toEqual([r(1, 1, 3), r(4, 4, 3)])
})

test('difference (closed, sum) - no overlap', () => {
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
  // b: - - - - 7 7
  // r: - 5 5 - - -
  a = RangeSet.difference(a, { ranges: [r(4, 5, 7)] })
  expect(a.ranges).toEqual([r(1, 2, 5)])
})

test('difference (closed, sum) - complete removal', () => {
  // i: 0 1 2 3 4 5
  // a: - - - - - -
  let a = {
    ranges: [],
    key: RangeSet.Key.closed,
    value: RangeSet.Value.sum
  } as RangeSet.T<number, number>

  // i: 0 1 2 3 4 5
  // a: - - - - - -
  // b: - 4 4 4 - -
  // r: - 4 4 4 - -
  a = RangeSet.union(a, { ranges: [r(1, 3, 4)] })
  expect(a.ranges).toEqual([r(1, 3, 4)])

  // i: 0 1 2 3 4 5
  // a: - 4 4 4 - -
  // b: - 2 2 2 - -
  // r: - - - - - -
  a = RangeSet.difference(a, { ranges: [r(1, 3, 2)] })
  expect(a.ranges).toEqual([])
})

test('difference (closed, sum) - partial removal at start', () => {
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
  // r: - - - - 5 -
  a = RangeSet.difference(a, { ranges: [r(1, 3, 2)] })
  expect(a.ranges).toEqual([r(4, 4, 5)])
})

test('difference (closed, sum) - partial removal at end', () => {
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
  expect(a.ranges).toEqual([r(1, 3, 6)])

  // i: 0 1 2 3 4 5
  // a: - 6 6 6 - -
  // b: - - - 2 2 2
  // r: - 6 6 - - -
  a = RangeSet.difference(a, { ranges: [r(3, 5, 2)] })
  expect(a.ranges).toEqual([r(1, 2, 6)])
})

test('difference (closed, sum) - multiple holes', () => {
  // i: 0 1 2 3 4 5 6 7
  // a: - - - - - - - -
  let a = {
    ranges: [],
    key: RangeSet.Key.closed,
    value: RangeSet.Value.sum
  } as RangeSet.T<number, number>

  // i: 0 1 2 3 4 5 6 7
  // a: - - - - - - - -
  // b: - 1 1 1 1 1 1 -
  // r: - 1 1 1 1 1 1 -
  a = RangeSet.union(a, { ranges: [r(1, 6, 1)] })
  expect(a.ranges).toEqual([r(1, 6, 1)])

  // i: 0 1 2 3 4 5 6 7
  // a: - 1 1 1 1 1 1 -
  // b: - - 2 - - 3 - -
  // r: - 1 - 1 1 - 1 -
  a = RangeSet.difference(a, { ranges: [r(2, 2, 2), r(5, 5, 3)] })
  expect(a.ranges).toEqual([r(1, 1, 1), r(3, 4, 1), r(6, 6, 1)])
})

test('difference (closed, sum) - single point ranges', () => {
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
  expect(a.ranges).toEqual([r(1, 1, 9)])

  // i: 0 1 2 3 4 5
  // a: - 9 - - - -
  // b: - 4 - - - -
  // r: - - - - - -
  a = RangeSet.difference(a, { ranges: [r(1, 1, 4)] })
  expect(a.ranges).toEqual([])
})

test('difference (closed, sum) - single point no overlap', () => {
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
  // b: - - - 5 - -
  // r: - 7 - - - -
  a = RangeSet.difference(a, { ranges: [r(3, 3, 5)] })
  expect(a.ranges).toEqual([r(1, 1, 7)])
})

test('difference (closed, sum) - range with single point removal', () => {
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
  expect(a.ranges).toEqual([r(1, 4, 3)])

  // i: 0 1 2 3 4 5
  // a: - 3 3 3 3 -
  // b: - - - 8 - -
  // r: - 3 3 - 3 -
  a = RangeSet.difference(a, { ranges: [r(3, 3, 8)] })
  expect(a.ranges).toEqual([r(1, 2, 3), r(4, 4, 3)])
})

test('difference (closed, sum) - empty sets', () => {
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
  a = RangeSet.difference(a, { ranges: [] })
  expect(a.ranges).toEqual([])
})

test('difference (closed, sum) - subtract from empty', () => {
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
  // r: - - - - - -
  a = RangeSet.difference(a, { ranges: [r(1, 3, 2)] })
  expect(a.ranges).toEqual([])
})

test('difference (closed, sum) - subtract empty', () => {
  // i: 0 1 2 3 4 5
  // a: - - - - - -
  let a = {
    ranges: [],
    key: RangeSet.Key.closed,
    value: RangeSet.Value.sum
  } as RangeSet.T<number, number>

  // i: 0 1 2 3 4 5
  // a: - - - - - -
  // b: - 5 5 5 - -
  // r: - 5 5 5 - -
  a = RangeSet.union(a, { ranges: [r(1, 3, 5)] })
  expect(a.ranges).toEqual([r(1, 3, 5)])

  // i: 0 1 2 3 4 5
  // a: - 5 5 5 - -
  // b: - - - - - -
  // r: - 5 5 5 - -
  a = RangeSet.difference(a, { ranges: [] })
  expect(a.ranges).toEqual([r(1, 3, 5)])
})

test('difference (closed, sum) - overlapping removals', () => {
  // i: 0 1 2 3 4 5 6 7 8 9
  // a: - - - - - - - - - -
  let a = {
    ranges: [],
    key: RangeSet.Key.closed,
    value: RangeSet.Value.sum
  } as RangeSet.T<number, number>

  // i: 0 1 2 3 4 5 6 7 8 9
  // a: - - - - - - - - - -
  // b: - 1 1 1 1 1 1 1 1 -
  // r: - 1 1 1 1 1 1 1 1 -
  a = RangeSet.union(a, { ranges: [r(1, 8, 1)] })
  expect(a.ranges).toEqual([r(1, 8, 1)])

  // i: 0 1 2 3 4 5 6 7 8 9
  // a: - 1 1 1 1 1 1 1 1 -
  // b: - - 2 2 2 - - 3 3 3
  // r: - 1 - - - 1 1 - - -
  a = RangeSet.difference(a, { ranges: [r(2, 4, 2), r(7, 9, 3)] })
  expect(a.ranges).toEqual([r(1, 1, 1), r(5, 6, 1)])
})

test('difference (closed, sum) - adjacent removals', () => {
  // i: 0 1 2 3 4 5 6 7
  // a: - - - - - - - -
  let a = {
    ranges: [],
    key: RangeSet.Key.closed,
    value: RangeSet.Value.sum
  } as RangeSet.T<number, number>

  // i: 0 1 2 3 4 5 6 7
  // a: - - - - - - - -
  // b: - 4 4 4 4 4 4 -
  // r: - 4 4 4 4 4 4 -
  a = RangeSet.union(a, { ranges: [r(1, 6, 4)] })
  expect(a.ranges).toEqual([r(1, 6, 4)])

  // i: 0 1 2 3 4 5 6 7
  // a: - 4 4 4 4 4 4 -
  // b: - - 1 1 2 2 - -
  // r: - 4 - - - - 4 -
  a = RangeSet.difference(a, { ranges: [r(2, 3, 1), r(4, 5, 2)] })
  expect(a.ranges).toEqual([r(1, 1, 4), r(6, 6, 4)])
})

test('difference (closed, min)', () => {
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
  // r: - 8 - - - -
  a = RangeSet.difference(a, { ranges: [r(2, 4, 5)] })
  expect(a.ranges).toEqual([r(1, 1, 8)])
})