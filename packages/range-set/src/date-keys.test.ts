import * as RangeSet from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const day = 24 * 60 * 60 * 1000
const d = (n: number) => new Date(Date.UTC(2024, 0, n))

/** Closed day-granularity ranges over Date keys: comparisons must go through key.cmp. */
const days: RangeSet.Key.T<Date> = {
  cmp: (a, b) => a.getTime() - b.getTime(),
  next: a => new Date(a.getTime() + day),
  prev: a => new Date(a.getTime() - day)
}

const r = RangeSet.Range.of

await test('union over Date keys merges adjacent equal-valued ranges', () => {
  const a = { ranges: [ r(d(1), d(3), 1) ], key: days, value: RangeSet.Value.sum }
  assert.deepEqual(RangeSet.union(a, { ranges: [ r(d(4), d(6), 1) ] }).ranges, [ r(d(1), d(6), 1) ])
  assert.deepEqual(RangeSet.union(a, { ranges: [ r(d(2), d(5), 2) ] }).ranges, [ r(d(1), d(1), 1), r(d(2), d(3), 3), r(d(4), d(5), 2) ])
  assert.deepEqual(RangeSet.union({ ...a, ranges: [ r(d(5), d(6), 1) ] }, { ranges: [ r(d(1), d(2), 1) ] }).ranges, [ r(d(1), d(2), 1), r(d(5), d(6), 1) ])
})

await test('intersection and difference over Date keys', () => {
  const a = { ranges: [ r(d(1), d(10), 1) ], key: days, value: RangeSet.Value.sum }
  assert.deepEqual(RangeSet.intersection(a, { ranges: [ r(d(5), d(20), 2) ] }).ranges, [ r(d(5), d(10), 3) ])
  assert.deepEqual(RangeSet.difference(a, { ranges: [ r(d(3), d(4), 0), r(d(8), d(20), 0) ] }).ranges, [ r(d(1), d(2), 1), r(d(5), d(7), 1) ])
})
