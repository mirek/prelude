import magnitude from './magnitude.js'
import scaled from './scaled.js'

/**
 * @returns unit vector.
 * @see {@link normalize} for mutable variant.
 */
export const normalized =
  (values: readonly number[]) => {
    // Only a zero vector needs guarding: clamping the magnitude to Number.EPSILON would
    // shrink any vector smaller than that (e.g. [1e-20, 0]) instead of normalising it.
    const m = magnitude(values)
    if (m === 0) {
      return scaled(values, 0)
    }
    // Divide rather than multiply by `1 / m`: the reciprocal of a subnormal magnitude overflows.
    return values.map(value => value / m)
  }

export default normalized
