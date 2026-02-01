/**
 * Defines operations for range boundaries (keys).
 *
 * @template T - The type of keys
 */
export type Key<T> = {
  /** Compares two keys, returns negative if a < b, 0 if equal, positive if a > b */
  cmp: (a: T, b: T) => number

  /**
   * Returns the next key value after the given key.
   * For half-open ranges use identity function.
   * For closed ranges use ie. `a + 1`.
   * For non continuous ranges, ie. date encoded as number 2025_06_30 use next day ie. `2025_07_01`.
   */
  next: (a: T) => T

  /**
   * Returns the previous key value before the given key.
   * See {@link next}.
   */
  prev: (a: T) => T
}

export type { Key as T }

/** @returns minimum of a and b */
export const min = <T>(key: Key<T>, a: T, b: T): T => (key.cmp(a, b) < 0 ? a : b)

/** @returns maximum of a and b */
export const max = <T>(key: Key<T>, a: T, b: T): T => (key.cmp(a, b) > 0 ? a : b)

/**
 * Key operations for closed intervals with integer boundaries.
 * In closed intervals, both start and end boundaries are inclusive.
 */
export const closed: Key<number> = {
  cmp: (a, b) => a - b,
  next: a => a + 1,
  prev: a => a - 1
}

/**
 * Key operations for half-open intervals with numeric boundaries.
 * In half-open intervals, the start is inclusive and the end is exclusive.
 */
export const halfOpen: Key<number> = {
  cmp: (a, b) => a - b,
  next: a => a,
  prev: a => a
}
