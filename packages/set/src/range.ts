const range =
  (a: number, b = 0, step = 1): Set<number> => {
    if (!(step > 0)) {
      throw new RangeError(`Expected step to be a positive number, got ${step}.`)
    }
    const min = Math.min(a, b)
    const max = Math.max(a, b)
    // A Set holds at most 2^24 entries; fail fast instead of grinding towards that limit.
    if ((max - min) / step > 16_777_216) {
      throw new RangeError(`Expected at most 16777216 values, got ${Math.ceil((max - min) / step)}.`)
    }
    const set = new Set<number>()
    // Values are computed from the index so fractional steps do not drift;
    // accumulating `i += step` could also stall forever once `step` fell below the ulp of `i`.
    const tolerance = step * 1e-9
    for (let k = 0; ; k++) {
      const value = min + (k * step)
      if (value >= max - tolerance) {
        break
      }
      set.add(value)
    }
    return set
  }

export default range
