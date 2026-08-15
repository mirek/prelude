/**
 * Creates a reducer function that uses the first element of the iterable as the initial value.
 * Similar to reduce but doesn't require an explicit initial value.
 *
 * @template T - Element type
 * @param reduction - Function that combines the accumulated result with each element and its index in the input
 * @returns A function that reduces an iterable using the first element as initial value
 * @throws {Error} If the input iterable is empty
 *
 * @example
 * ```ts
 * G.pipe(
 *   G.range(1, 5),
 *   G.reduce1((acc, val) => acc + val)
 * ) // 15
 * ```
 */
export const reduce1 =
  <T>(reduction: (result: T, value: T, index: number) => T) =>
    (values: Iterable<T>): T => {
      const iterator = values[Symbol.iterator]()
      const first = iterator.next()
      if (first.done) {
        throw new Error('reduce1: empty iterator')
      }
      // Continue with the same iterator; re-iterating `values` would repeat the first element for re-iterable inputs.
      let result = first.value
      let index = 1
      for (const value of { [Symbol.iterator]: () => iterator }) {
        result = reduction(result, value, index++)
      }
      return result
    }

export default reduce1
