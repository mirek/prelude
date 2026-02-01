import * as RangeSet from './range-set.js'
import * as Range from './range.js'
import * as Key from './key.js'

/**
 * Computes the intersection of two range sets, finding overlapping portions.
 *
 * Only the overlapping portions of ranges from both sets are included in the result.
 * When ranges overlap, their values are merged according to the value merge function.
 * Non-overlapping portions are excluded from the result.
 *
 * @template K - The type of range boundaries
 * @template V - The type of range values
 * @param rangeSet - The first range set
 * @param otherRangeSet - The second range set containing ranges to intersect with the first
 * @returns A new range set containing only the overlapping portions of both input range sets
 */
export const intersection = <K, V>(
  rangeSet: RangeSet.T<K, V>,
  otherRangeSet: { ranges: Range.T<K, V>[] }
): RangeSet.T<K, V> => {
  const ranges: Range.T<K, V>[] = []
  let i = 0
  let j = 0
  const { key } = rangeSet

  while (i < rangeSet.ranges.length && j < otherRangeSet.ranges.length) {
    const x = rangeSet.ranges[i]
    const y = otherRangeSet.ranges[j]

    const xEndNext = key.next(x.end)
    const yEndNext = key.next(y.end)

    const start = Key.max(key, x.start, y.start)
    const end = Key.min(key, xEndNext, yEndNext)

    if (start < end) {
      ranges.push({
        start,
        end: rangeSet.key.prev(end),
        value: rangeSet.value.merge(x.value, y.value)
      })
    }

    if (xEndNext < yEndNext) {
      i++
    } else {
      j++
    }
  }
  return { ...rangeSet, ranges }
}
