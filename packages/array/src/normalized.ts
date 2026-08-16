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
    return scaled(values, m === 0 ? 0 : 1 / m)
  }

export default normalized
