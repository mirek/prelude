/**
 * Creates an async generator that yields a sequence of numbers within a specified range.
 *
 * @description
 * This function creates an async generator that yields numbers starting from `start` and
 * incrementing by `step` until reaching `end` (inclusive).
 *
 * If `end` is greater than or equal to `start` and no step is provided, it defaults to 1.
 * If `end` is less than `start` and no step is provided, it defaults to -1.
 *
 * This function is useful for creating numeric sequences, iteration counts, or as a base
 * for generating derived sequences.
 *
 * @param start - The first number in the sequence
 * @param end - The last number in the sequence (inclusive)
 * @param step - The increment between numbers (default: 1 for ascending, -1 for descending)
 * @returns An async generator that yields numbers in the specified range
 *
 * @example
 * ```ts
 * // Basic range from 1 to 5
 * const numbers = await G.pipe(
 *   G.range(1, 5),
 *   G.array
 * ); // [1, 2, 3, 4, 5]
 *
 * // Descending range with default step
 * const countdown = await G.pipe(
 *   G.range(5, 1),
 *   G.array
 * ); // [5, 4, 3, 2, 1]
 *
 * // Range with custom step
 * const evenNumbers = await G.pipe(
 *   G.range(2, 10, 2),
 *   G.array
 * ); // [2, 4, 6, 8, 10]
 *
 * // Negative step for descending with specific intervals
 * const descending = await G.pipe(
 *   G.range(10, 0, -2),
 *   G.array
 * ); // [10, 8, 6, 4, 2, 0]
 * ```
 */
export const range =
  async function* (start: number, end: number, step?: number): AsyncGenerator<number> {
    const step_ = step ?? (end >= start ? 1 : -1)
    if (!Number.isFinite(step_) || step_ === 0) {
      throw new RangeError(`Expected step to be a non-zero finite number, got ${step_}.`)
    }
    // Compute each value from the index instead of accumulating, so floating point steps do not
    // drift and the documented inclusive end is reached (e.g. 0, 0.1, 0.2, 0.3). The tolerance is a
    // few ulps of the endpoints, so it only absorbs rounding error and can never span the interval;
    // an infinite end is never reached and gets none, so `range(0, Infinity)` keeps counting.
    const tolerance = Number.isFinite(end) ? 4 * Number.EPSILON * Math.max(Math.abs(start), Math.abs(end)) : 0
    for (let i = 0; ; i++) {
      const value = start + (i * step_)
      // Compare distances rather than `end + tolerance`, which can overflow to Infinity.
      if (!Number.isFinite(value) || (step_ > 0 ? value - end > tolerance : end - value > tolerance)) {
        return
      }
      yield Math.abs(value - end) <= tolerance ? end : value
    }
  }

export default range
