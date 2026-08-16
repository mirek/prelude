import closeIterator from './close-iterator.js'
import type { Value } from './prelude.js'

/**
 * Creates a generator that yields objects where each property comes from the corresponding position in the input iterables.
 * Stops when any of the input iterables is exhausted.
 *
 * @template Arg - Type of the input record of iterables
 * @param {Arg} iterables - Record of iterables to zip
 * @yields {Object} Object with the same keys as the input, where each value comes from the corresponding iterable
 * @example
 * ```ts
 * const names = ['Alice', 'Bob', 'Charlie'];
 * const ages = [25, 30, 35];
 *
 * const records = G.pipe(
 *   G.zipRecord({ name: names, age: ages }),
 *   G.array
 * );
 * // => [{ name: 'Alice', age: 25 }, { name: 'Bob', age: 30 }, { name: 'Charlie', age: 35 }]
 * ```
 */
export const zipRecord =
  function* <Arg extends { [key: string]: Iterable<unknown> }>(iterables: Arg): Generator<{ [K in keyof Arg]: Value<Arg[K]> }> {
    const keys = Object.keys(iterables)
    const iterators = keys.map(_ => iterables[_][Symbol.iterator]())
    // With no inputs there is nothing to combine: `some(done)` would never be true and the loop would spin forever.
    if (iterators.length === 0) {
      return
    }
    // The source that reported `done` (at most one) must not be closed again.
    let exhausted: Iterator<unknown> | undefined
    let failed = false
    try {
      while (true) {
        // Pull one source at a time and stop at the first exhausted one (see zip).
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
        yield Object.fromEntries(keys.map((_, i) => [ _, values[i] ])) as { [K in keyof Arg]: Value<Arg[K]> }
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

export default zipRecord
