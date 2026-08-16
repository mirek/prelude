/**
 * @returns cartesian distance from origin.
 *
 * Components are divided by the largest absolute component before squaring, so vectors of very
 * small (e.g. `1e-200`) or very large (e.g. `1e200`) components neither underflow to `0` nor
 * overflow to `Infinity` the way a plain sum of squares would.
 */
export const magnitude =
  (values: readonly number[]) => {
    let max = 0
    for (let i = 0; i < values.length; ++i) {
      max = Math.max(max, Math.abs(values[i]))
    }
    if (max === 0 || !Number.isFinite(max)) {
      return max
    }
    let sum = 0
    for (let i = 0; i < values.length; ++i) {
      const value = values[i] / max
      sum += value * value
    }
    return max * Math.sqrt(sum)
  }

export default magnitude
