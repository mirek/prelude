import * as RangeSet from './range-set.js'
import * as Range from './range.js'

/**
 * Computes the difference of two range sets, removing overlapping portions.
 *
 * Returns a new range set containing only the portions of the first range set
 * that do not overlap with any ranges in the second range set. Overlapping
 * portions are removed from the result.
 *
 * @template K - The type of range boundaries
 * @template V - The type of range values
 * @param rangeSet - The first range set containing
 * @param otherRangeSet - The second range set containing ranges to subtract from the first
 * @returns A new range set with overlapping portions removed
 */
export const difference = <K, V>(
  rangeSet: RangeSet.T<K, V>,
  { ranges: ys }: { ranges: Range.T<K, V>[] }
): RangeSet.T<K, V> => {
  const ranges: Range.T<K, V>[] = []
  let i = 0
  let j = 0
  const { key } = rangeSet

  // Process each original range
  while (i < rangeSet.ranges.length) {
    let x = { ...rangeSet.ranges[i] }

    // Start from j to process subtraction ranges in order
    let k = j

    // Process overlapping subtraction ranges
    while (k < ys.length && ys[k].start < key.next(x.end)) {
      const y = ys[k]

      // Skip if subtraction range is entirely before current range
      if (key.next(y.end) <= x.start) {
        k++
        continue
      }

      // Keep the part of x before y starts
      if (x.start < y.start) {
        ranges.push({
          ...x,
          start: x.start,
          end: key.prev(y.start)
        })
      }

      // Skip the overlapping part by moving x's start past y's end
      x.start = key.next(y.end)

      // If nothing remains of x, stop processing
      if (x.start > x.end) {
        break
      }
      k++
    }

    // Add remaining part of x if any
    if (x.start <= x.end) {
      ranges.push(x)
    }

    i++
  }

  return { ...rangeSet, ranges }
}
