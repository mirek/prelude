import magnitude from './magnitude.js'
import scale from './scale.js'

/** Converts `values` vector into unit vector inplace. */
export const normalize =
  (values: number[]) =>
    // Only a zero vector needs guarding: clamping the magnitude to Number.EPSILON would
    // shrink any vector smaller than that (e.g. [1e-20, 0]) instead of normalising it.
    scale(values, magnitude(values) === 0 ? 0 : 1 / magnitude(values))

export default normalize
