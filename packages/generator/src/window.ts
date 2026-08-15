/**
 * Creates a generator that yields sliding windows of values from the source iterable.
 *
 * @template T - The type of elements in the source iterable.
 * @param n - The window size (number of elements in each window).
 * @param yieldShorter - Whether to yield a final window smaller than n if the source iterable ends (default: false).
 * @returns A generator function that takes an iterable and yields arrays representing sliding windows.
 * @yields Arrays of length n containing consecutive elements from the source iterable.
 *
 * @example
 * ```ts
 * G.pipe(
 *   [1, 2, 3, 4, 5],
 *   G.window(3),
 *   G.array
 * ) // [[1, 2, 3], [2, 3, 4], [3, 4, 5]]
 *
 * G.pipe(
 *   [1, 2],
 *   G.window(3, true),
 *   G.array
 * ) // [[1, 2]]
 * ```
 */
const window_ =
  <T>(n: number, yieldShorter = false) => {
    if (!Number.isSafeInteger(n) || n < 1) {
      throw new RangeError(`Expected window size to be a positive integer, got ${n}.`)
    }
    return function* (values: Iterable<T>): Generator<T[]> {
      const range: T[] = []
      for (const value of values) {
        switch (range.push(value)) {
          case n + 1:
            range.shift()
          case n:
            yield range.slice()
        }
      }
      if (range.length > 0 && range.length < n && yieldShorter) {
        yield range
      }
    }
  }

export { window_ as window }

export default window_
