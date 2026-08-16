const range1 =
  (a: number, b = 1, step = 1): Set<number> => {
    if (!(Number.isFinite(step) && step > 0)) {
      throw new RangeError(`Expected step to be a positive finite number, got ${step}.`)
    }
    const min = Math.min(a, b)
    const max = Math.max(a, b)
    // A Set holds at most 2^24 entries; fail fast instead of grinding towards that limit.
    // The range is inclusive, so the count is one more than the number of steps.
    const count = Math.floor((max - min) / step) + 1
    if (count > 16_777_216) {
      throw new RangeError(`Expected at most 16777216 values, got ${count}.`)
    }
    const set = new Set<number>()
    // Values are computed from the index so fractional steps do not drift and the inclusive end is reached;
    // accumulating `i += step` could also stall forever once `step` fell below the ulp of `i`.
    // The tolerance is a few ulps of the endpoints, so it only absorbs rounding error and can
    // never span the interval.
    // Capped below half the step and half the interval, so a narrow interval at a large magnitude
    // (e.g. `range(1e16, 1e16 + 2, 1)`) can never have distinct values collapsed onto the bound.
    const tolerance = Math.min(4 * Number.EPSILON * Math.max(Math.abs(min), Math.abs(max)), step / 2, (max - min) / 2)
    for (let k = 0; ; k++) {
      const value = min + (k * step)
      // Compare distances rather than `max + tolerance`, which can overflow to Infinity.
      if (!Number.isFinite(value) || value - max > tolerance) {
        break
      }
      set.add(Math.abs(value - max) <= tolerance ? max : value)
    }
    return set
  }

export default range1
