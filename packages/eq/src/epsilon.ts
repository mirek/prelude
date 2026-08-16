/**
 * @returns equality of numbers whose difference is within `e` (inclusive, like `Cmp.epsilon`),
 * so `epsilon(0)` is exact equality and every value equals itself (paired NaNs are equal, like `Eq.number`).
 */
export function epsilon(e = Number.EPSILON) {
  return function (a: number, b: number) {
    return (
      a === b ||
      (Number.isNaN(a) && Number.isNaN(b)) ||
      Math.abs(a - b) <= e
    )
  }
}
