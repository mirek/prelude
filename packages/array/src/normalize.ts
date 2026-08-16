import magnitude from './magnitude.js'
import scale from './scale.js'

/** Converts `values` vector into unit vector inplace. */
export const normalize =
  (values: number[]) => {
    // Only a zero vector needs guarding: clamping the magnitude to Number.EPSILON would
    // shrink any vector smaller than that (e.g. [1e-20, 0]) instead of normalising it.
    const m = magnitude(values)
    return scale(values, m === 0 ? 0 : 1 / m)
  }

export default normalize
