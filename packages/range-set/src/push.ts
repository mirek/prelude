import type * as Range from './range.js'
import type * as RangeSet from './range-set.js'

/**
 * Appends `range` to `rs`, merging it into the last range when the two touch
 * and carry equal values, so results stay canonical: pieces produced by
 * splitting an overlap can end up adjacent with the same value.
 */
export const push = <K, V>(
  { key, value }: Pick<RangeSet.T<K, V>, 'key' | 'value'>,
  rs: Range.T<K, V>[],
  range: Range.T<K, V>
): void => {
  const last = rs[rs.length - 1]
  if (last !== undefined && key.cmp(key.next(last.end), range.start) === 0 && value.eq(last.value, range.value)) {
    rs[rs.length - 1] = { ...last, end: range.end }
  } else {
    rs.push(range)
  }
}

export default push
