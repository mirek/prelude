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
    // drift and the documented inclusive end is reached (e.g. 0, 0.1, 0.2, 0.3).
    const tolerance = Math.abs(step_) * 1e-9
    for (let i = 0; ; i++) {
      const value = start + (i * step_)
      if (step_ > 0 ? value > end + tolerance : value < end - tolerance) {
        return
      }
      yield Math.abs(value - end) <= tolerance ? end : value
    }
  }

export default range
