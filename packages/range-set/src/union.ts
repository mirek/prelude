import * as Range from './range.js'
import overBoth from './over-both.js'
import push from './push.js'
import type * as RangeSet from './range-set.js'

const reduction = <K, V>(
  rangeSet: Pick<RangeSet.T<K, V>, 'key' | 'value'>,
  rs: Range.T<K, V>[],
  x: Range.T<K, V>
): Range.T<K, V>[] => {
  const { key, value } = rangeSet

  // The very first range stays as is.
  const r = rs.pop()
  if (r == null) {
    push(rangeSet, rs, x)
    return rs
  }

  // No overlap (touching ranges with equal values are joined by `push`).
  if (key.cmp(key.next(r.end), x.start) <= 0) {
    push(rangeSet, rs, r)
    push(rangeSet, rs, x)
    return rs
  }

  // First part. Never mutate `r`: it may be one of the caller's input ranges.
  let head = r
  if (key.cmp(x.start, r.start) > 0) {
    push(rangeSet, rs, { ...r, end: key.prev(x.start) })
    head = { ...r, start: x.start }
  }

  // Unify shared part.
  push(rangeSet, rs, {
    value: value.merge(head.value, x.value),
    start: head.start,
    end: key.cmp(x.end, r.end) < 0 ? x.end : r.end
  })

  // Remaining part covered by current range.
  if (key.cmp(x.end, r.end) > 0) {
    push(rangeSet, rs, { ...x, start: key.next(r.end) })
  }

  // Remaining part covered by last range.
  if (key.cmp(x.end, r.end) < 0) {
    push(rangeSet, rs, { ...r, start: key.next(x.end) })
  }

  return rs
}

/**
 * Computes the union of two range sets, merging overlapping and adjacent ranges.
 *
 * When ranges overlap or are adjacent with equal values, they are merged into a single range.
 * When ranges overlap with different values, the overlapping portion gets a merged value
 * according to the value merge function, and non-overlapping portions are preserved.
 *
 * @template K - The type of range boundaries
 * @template V - The type of range values
 * @param rangeSet - The first range set containing key/value operations and ranges
 * @param otherRangeSet - The second range set containing ranges to union with the first
 * @returns A new range set containing the union of both input range sets
 *
 * @example
 * ```typescript
 * const rs1 = { ranges: [Range.of(1, 3, 5)], key: Key.closed, value: Value.sum };
 * const rs2 = { ranges: [Range.of(2, 4, 3)] };
 * const result = union(rs1, rs2);
 * // Result contains merged ranges with summed values where they overlap
 * ```
 */
export const union = <K, V>(
  rangeSet: RangeSet.T<K, V>,
  otherRangeSet: { ranges: Range.T<K, V>[] }
): RangeSet.T<K, V> => {
  let ranges: Range.T<K, V>[] = []
  for (const range of overBoth(rangeSet, otherRangeSet, rangeSet.key)) {
    ranges = reduction(rangeSet, ranges, range)
  }
  return { ...rangeSet, ranges }
}
