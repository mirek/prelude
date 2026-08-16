import type { Consumer } from './prelude.js'
import assertConcurrency from './assert-concurrency.js'

/**
 * Creates a consumer that processes all values from an async iterable without returning a result.
 *
 * @description
 * This function creates a terminal consumer that processes every value in an async iterable,
 * typically for side effects. It doesn't produce a value but simply ensures that all values
 * are processed by the optional callback function.
 *
 * The consumer supports concurrent processing with the `concurrency` option. When greater than 1,
 * multiple worker threads will process values in parallel, which can improve performance for
 * CPU-bound or I/O-bound operations.
 *
 * If no callback is provided, this effectively just drains the async iterable, ensuring all
 * values are processed.
 *
 * @template T - The type of values in the async iterable
 * @param callback - Optional function to apply to each value
 * @param options - Configuration options
 * @param options.concurrency - Number of concurrent worker threads (default: 1)
 * @param options.signal - Aborting stops pulling values, returns the source iterator, waits for
 *   callbacks already in flight and rejects with `signal.reason`
 * @param options.signal - Aborting stops pulling values, returns the source iterator, waits for
 *   callbacks already in flight and rejects with `signal.reason`
 * @returns A consumer function that returns a promise resolving to void
 *
 * @example
 * ```ts
 * // Simple sequential processing
 * await G.pipe(
 *   G.ofIterable([1, 2, 3, 4, 5]),
 *   G.consume(value => {
 *     console.log(`Processing: ${value}`);
 *   })
 * );
 *
 * // Concurrent processing of CPU-intensive operations
 * await G.pipe(
 *   G.ofIterable(largeDataset),
 *   G.consume(async item => {
 *     await processItemIntensively(item);
 *   }, { concurrency: 4 }) // Use 4 concurrent workers
 * );
 *
 * // Just drain the iterable (run it to completion)
 * await G.pipe(
 *   generatorThatHasSideEffects(),
 *   G.consume() // No callback, just ensures all values are processed
 * );
 *
 * // Concurrent processing with database operations
 * await G.pipe(
 *   G.ofIterable(records),
 *   G.consume(async record => {
 *     await db.insert(record);
 *   }, { concurrency: 10 }) // Handle 10 DB operations concurrently
 * );
 * ```
 */
export function consume<T>(
  callback?: (value: T, index: number, worker: number) => unknown,
  { concurrency = 1, signal }: { concurrency?: number, signal?: AbortSignal } = {}
): Consumer<T, void> {
  assertConcurrency(concurrency)
  return async function (values) {
    signal?.throwIfAborted()
    let index = 0
    // Share one iterator between workers; iterating `values` per worker would replay
    // re-iterable async iterables `concurrency` times.
    const iterator = values[Symbol.asyncIterator]()
    // Serialise next() calls: hand-written iterators may only permit one in-flight next(), like under for-await.
    let pull: Promise<IteratorResult<T> | void> = Promise.resolve()
    let failed = false
    let exhausted = false
    const workers = Array.from({ length: concurrency }, async (_, worker) => {
      // Stop pulling as soon as any worker failed; otherwise the others would keep draining the source.
      while (!failed) {
        // Re-check inside the chain: `return()` may have settled an earlier pull after this one was queued.
        const next: Promise<IteratorResult<T>> = pull.then(() => failed ? { done: true, value: undefined } : iterator.next())
        pull = next
        const result = await next
        if (result.done) {
          // Only a real `done` from the source counts as exhaustion (not the post-failure sentinel).
          exhausted ||= !failed
          return
        }
        if (callback) {
          await Promise.resolve(callback(result.value, index++, worker))
        }
      }
    })
    // Aborting behaves like a worker failure with `signal.reason`: no more values are pulled,
    // the source is returned, callbacks already in flight are awaited, then the reason is thrown.
    let offAbort: () => void = () => {}
    const aborted = new Promise<never>((_, reject) => {
      if (!signal) {
        return
      }
      const onAbort = () => reject(signal.reason)
      signal.addEventListener('abort', onAbort, { once: true })
      offAbort = () => signal.removeEventListener('abort', onAbort)
    })
    aborted.catch(() => {})
    try {
      await Promise.race([ Promise.all(workers), aborted ])
    } catch (error: unknown) {
      failed = true
      // Close the source first: workers blocked in `iterator.next()` on an event-driven source
      // (for example a channel whose writer is still open) only settle once it is closed, so
      // awaiting them before `return()` would deadlock. Then let in-flight callbacks settle.
      if (!exhausted) {
        await Promise.resolve().then(() => iterator.return?.()).catch(() => {})
      }
      await Promise.allSettled(workers)
      throw error
    } finally {
      offAbort()
    }
  }
}
