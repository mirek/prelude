import type * as Range from './range.js'
import type * as RangeSet from './range-set.js'

/**
 * Generator function that yields ranges from both range sets in sorted order by start position.
 *
 * This function merges two arrays of ranges, yielding them in order of their start positions.
 * When ranges have the same start position, both are yielded (first from xs, then from ys).
 * This is useful for algorithms that need to process ranges from multiple sets in order.
 *
 * @template K - The type of range boundaries
 * @template V - The type of range values
 * @param xs - Object containing the first array of ranges
 * @param ys - Object containing the second array of ranges
 * @yields Ranges from both arrays in sorted order by start position
 */
export const overBoth = function* <K, V>(
  { ranges: xs }: Pick<RangeSet.T<K, V>, 'ranges'>,
  { ranges: ys }: Pick<RangeSet.T<K, V>, 'ranges'>
): Generator<Range.T<K, V>> {
  let i = 0
  let j = 0
  while (i < xs.length && j < ys.length) {
    const x = xs[i]
    const y = ys[j]
    if (x.start < y.start) {
      yield x
      i++
    } else if (x.start > y.start) {
      yield y
      j++
    } else {
      yield x
      yield y
      i++
      j++
    }
  }
  while (i < xs.length) {
    yield xs[i]
    i++
  }
  while (j < ys.length) {
    yield ys[j]
    j++
  }
}

export default overBoth
