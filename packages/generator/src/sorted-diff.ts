import * as Cmp from '@prelude/cmp'
import closeIterator from './close-iterator.js'

/**
 * Returns a generator that compares two sorted iterables and yields tuples of corresponding elements.
 * For matched elements, yields [lhs, rhs]. For elements only in lhs, yields [lhs, undefined].
 * For elements only in rhs, yields [undefined, rhs].
 *
 * @template Lhs - The type of left-hand side elements
 * @template Rhs - The type of right-hand side elements
 * @param rhsValues - The right-hand side iterable (must be sorted)
 * @param cmp - The comparison function for comparing lhs and rhs elements (any negative/zero/positive result, e.g. `a - b`)
 * @param direction - The direction of comparison (ascending by default)
 * @yields Tuples of corresponding elements from both iterables
 * @see {@link diff} for a version that doesn't require presorted inputs
 * @example
 * ```ts
 * G.pipe(
 *   [1, 3, 5],
 *   G.sortedDiff([2, 3, 4], (a, b) => a - b),
 *   G.array
 * ) // [[1, undefined], [undefined, 2], [3, 3], [undefined, 4], [5, undefined]]
 * ```
 */
export const sortedDiff =
  <Lhs, Rhs>(rhsValues: Iterable<Rhs>, cmp: (lhs: Lhs, rhs: Rhs) => number, direction = Cmp.asc) =>
    function* (lhsValues: Iterable<Lhs>): Generator<[lhs: undefined | Lhs, rhs: undefined | Rhs]> {
      const lhsIterator = lhsValues[Symbol.iterator]()
      const rhsIterator = rhsValues[Symbol.iterator]()
      let lhsValue: IteratorResult<Lhs> | undefined
      let rhsValue: IteratorResult<Rhs> | undefined
      let failed = false
      try {
        lhsValue = lhsIterator.next()
        rhsValue = rhsIterator.next()
        while (!lhsValue.done && !rhsValue.done) {
          // Normalise so comparators returning arbitrary magnitudes (e.g. `a - b`) work.
          switch (Math.sign(cmp(lhsValue.value, rhsValue.value))) {
            case Cmp.eq:
              yield [lhsValue.value, rhsValue.value]
              lhsValue = lhsIterator.next()
              rhsValue = rhsIterator.next()
              break
            case direction:
              yield [lhsValue.value, undefined]
              lhsValue = lhsIterator.next()
              break
            default:
              yield [undefined, rhsValue.value]
              rhsValue = rhsIterator.next()
          }
        }
        while (!lhsValue.done) {
          yield [lhsValue.value, undefined]
          lhsValue = lhsIterator.next()
        }
        while (!rhsValue.done) {
          yield [undefined, rhsValue.value]
          rhsValue = rhsIterator.next()
        }
      } catch (error) {
        failed = true
        throw error
      } finally {
        // Close the sources that were not exhausted, whether we finished or the consumer stopped early.
        if (!lhsValue?.done) {
          closeIterator(lhsIterator, failed)
        }
        if (!rhsValue?.done) {
          closeIterator(rhsIterator, failed)
        }
      }
    }

export default sortedDiff
