/**
 * Represents a range with start and end boundaries and an associated value.
 *
 * @template K - The type of range boundaries (keys)
 * @template V - The type of value associated with this range
 */
export type Range<K, V> = {
  /** The start boundary of the range (inclusive) */
  start: K

  /** The end boundary of the range (inclusive or exclusive, interpretation is defined through Key.next/Key.prev on RangeSet). */
  end: K

  /** The value associated with this range */
  value: V
}

export type { Range as T }

/**
 * Creates a new Range with the specified start, end, and value.
 *
 * @template K - The type of range boundaries
 * @template V - The type of range value
 * @param start - The start boundary of the range (inclusive)
 * @param end - The end boundary of the range (inclusive or exclusive based on RangeSet.set.next/prev config)
 * @param value - The value to associate with this range
 * @returns A new Range object
 * @throws Error if start boundary is greater than end boundary
 *
 */
export const of = <K, V>(start: K, end: K, value: V): Range<K, V> => {
  if (start > end) {
    throw new Error('expected start boundary to be less than or equal to end boundary')
  }
  return {
    start,
    end,
    value
  }
}
