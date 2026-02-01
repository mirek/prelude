import type * as Range from './range.js'
import * as Key from './key.js'
import * as Value from './value.js'

/**
 * A set of non-overlapping ranges with associated values.
 * 
 * @template K - The type of range boundaries (keys)
 * @template V - The type of values associated with ranges
 */
export type RangeSet<K, V> = {
  /** Array of non-overlapping ranges sorted by start position */
  ranges: Range.T<K, V>[]
  /** Key operations for range boundaries (comparison, next/prev) */
  key: Key.T<K>
  /** Value operations for merging and comparing range values */
  value: Value.T<V>
}

export type { RangeSet as T }
