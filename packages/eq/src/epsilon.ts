/**
 * @returns equality of numbers whose difference is within `e` (inclusive, like `Cmp.epsilon`),
 * so `epsilon(0)` is exact equality and every value equals itself.
 */
export function epsilon(e = Number.EPSILON) {
  return function (a: number, b: number) {
    return a === b || Math.abs(a - b) <= e
  }
}
