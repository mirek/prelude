import closeIterator from './close-iterator.js'
import type { Value } from './prelude.js'

/**
 * Combines multiple iterables into a generator of tuples containing values at corresponding positions.
 * Stops when any of the input iterables is exhausted.
 *
 * @template Args - Array of iterable types
 * @param {...Args} iterables - Input iterables to zip together
 * @yields {Object} Tuple containing values from each iterable at the current position
 * @example
 * ```ts
 * G.pipe(
 *   G.zip([1, 2, 3], ['a', 'b', 'c']),
 *   G.array
 * ) // [[1, 'a'], [2, 'b'], [3, 'c']]
 *
 * // With different length iterables, stops at shortest
 * G.pipe(
 *   G.zip([1, 2], ['a', 'b', 'c']),
 *   G.array
 * ) // [[1, 'a'], [2, 'b']]
 * ```
 */
export const zip =
  function* <Args extends Iterable<unknown>[]>(...iterables: Args): Generator<{ [K in keyof Args]: Value<Args[K]> }> {
    const iterators = iterables.map(_ => _[Symbol.iterator]())
    // With no inputs there is nothing to combine: `some(done)` would never be true and the loop would spin forever.
    if (iterators.length === 0) {
      return
    }
    // The source that reported `done` (at most one) must not be closed again.
    let exhausted: Iterator<unknown> | undefined
    let failed = false
    try {
      while (true) {
        // Pull one source at a time and stop at the first exhausted one, so later sources are
        // not advanced past the value they would otherwise have kept.
        const values: unknown[] = []
        for (const iterator of iterators) {
          const result = iterator.next()
          if (result.done) {
            exhausted = iterator
            break
          }
          values.push(result.value)
        }
        if (exhausted) {
          break
        }
        yield values as { [K in keyof Args]: Value<Args[K]> }
      }
    } catch (error) {
      failed = true
      throw error
    } finally {
      // Close every source that was not exhausted, whether we finished or the consumer stopped early.
      for (const iterator of iterators) {
        if (iterator !== exhausted) {
          closeIterator(iterator, failed)
        }
      }
    }
  }

export default zip
