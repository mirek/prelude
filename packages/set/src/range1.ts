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
    const tolerance = step * 1e-9
    for (let k = 0; ; k++) {
      const value = min + (k * step)
      if (value > max + tolerance) {
        break
      }
      set.add(Math.abs(value - max) <= tolerance ? max : value)
    }
    return set
  }

export default range1
