/**
 * Generates a sequence of numbers from start to end inclusive.
 * If end > start and no step is provided, step defaults to 1.
 * If end < start and no step is provided, step defaults to -1.
 *
 * @param start - The first number in the sequence
 * @param end - The last number in the sequence
 * @param step - Optional step between numbers (default: inferred from start/end)
 * @yields Numbers from start to end with the given step
 *
 * @example
 * ```ts
 * G.pipe(
 *   G.range(1, 5),
 *   G.array
 * ) // [1, 2, 3, 4, 5]
 *
 * G.pipe(
 *   G.range(10, 1, -2),
 *   G.array
 * ) // [10, 8, 6, 4, 2]
 * ```
 */
export const range =
  function* (start: number, end: number, step?: number): Generator<number> {
    const step_ = step ?? (end >= start ? 1 : -1)
    if (!Number.isFinite(step_) || step_ === 0) {
      throw new RangeError(`Expected step to be a non-zero finite number, got ${step_}.`)
    }
    // Compute each value from the index instead of accumulating, so floating point steps do not
    // drift and the documented inclusive end is reached (e.g. 0, 0.1, 0.2, 0.3). The tolerance is a
    // few ulps of the endpoints, so it only absorbs rounding error and can never span the interval;
    // an infinite end is never reached and gets none, so `range(0, Infinity)` keeps counting.
    // Capped below half the step and half the interval, so a narrow interval at a large magnitude
    // (e.g. `range(1e16, 1e16 + 2, 1)`) can never have distinct values collapsed onto the end.
    const tolerance = Number.isFinite(end) ?
      Math.min(
        4 * Number.EPSILON * Math.max(Math.abs(start), Math.abs(end)),
        Math.abs(step_) / 2,
        Math.abs(end - start) / 2
      ) :
      0
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
