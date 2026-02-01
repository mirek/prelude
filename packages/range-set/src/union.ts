import * as Range from './range.js'
import overBoth from './over-both.js'
import type * as RangeSet from './range-set.js'

const reduction = <K, V>(
  { key, value }: Pick<RangeSet.T<K, V>, 'key' | 'value'>,
  rs: Range.T<K, V>[],
  x: Range.T<K, V>
): Range.T<K, V>[] => {
  // The very first range stays as is.
  const r = rs.pop()
  if (r == null) {
    rs.push(x)
    return rs
  }

  // There is no overlap, both ranges stay as is.
  if (key.next(r.end) < x.start) {
    rs.push(r)
    rs.push(x)
    return rs
  }

  // Ranges are touching but not overlapping.
  if (key.next(r.end) === x.start) {
    if (value.eq(r.value, x.value)) {
      // Both ranges have the same values, merge into one.
      rs.push({ ...r, start: r.start, end: x.end })
    } else {
      // Ranges have different values, leave them as is.
      rs.push(r)
      rs.push(x)
    }
    return rs
  }

  // First part.
  if (x.start > r.start) {
    rs.push({ ...r, end: key.prev(x.start) })
    r.start = x.start
  }

  // Unify shared part.
  rs.push({
    value: value.merge(r.value, x.value),
    start: r.start,
    end: key.cmp(x.end, r.end) < 0 ? x.end : r.end
  })

  // Remaining part covered by current range.
  if (x.end > r.end) {
    rs.push({ ...x, start: key.next(r.end) })
  }

  // Remaining part covered by last range.
  if (x.end < r.end) {
    rs.push({ ...r, start: key.next(x.end) })
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
  for (const range of overBoth(rangeSet, otherRangeSet)) {
    ranges = reduction(rangeSet, ranges, range)
  }
  return { ...rangeSet, ranges }
}
