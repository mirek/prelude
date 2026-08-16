import magnitude from './magnitude.js'
import scale from './scale.js'

/** Converts `values` vector into unit vector inplace. */
export const normalize =
  (values: number[]) => {
    // Only a zero vector needs guarding: clamping the magnitude to Number.EPSILON would
    // shrink any vector smaller than that (e.g. [1e-20, 0]) instead of normalising it.
    const m = magnitude(values)
    if (m === 0) {
      return scale(values, 0)
    }
    // Divide rather than multiply by `1 / m`: the reciprocal of a subnormal magnitude overflows.
    for (let i = 0; i < values.length; ++i) {
      values[i] /= m
    }
    return values
  }

export default normalize
