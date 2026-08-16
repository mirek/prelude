import * as Ch from '@prelude/channel'
import abortConcurrent from './abort.js'
import assertConcurrency from './assert-concurrency.js'
import pool from './pool.js'

/**
 * Serial implementation of tap transformation.
 *
 * @internal
 * @param f - Function to apply to each value
 * @returns Transformer function that applies the function and yields the original values
 */
function serialTap<T>(
  f: (value: T, index: number, worker: number) => void | Promise<void>,
  signal: undefined | AbortSignal
) {
  return async function* (values: AsyncIterable<T>) {
    let index = 0
    // Cooperative: checked before every pull, so an abort takes effect once the current value is done.
    signal?.throwIfAborted()
    for await (const value of values) {
      signal?.throwIfAborted()
      await Promise.resolve(f(value, index++, 0))
      yield value
      signal?.throwIfAborted()
    }
  }
}

/**
 * Concurrent implementation of tap transformation.
 *
 * @internal
 * @param f - Function to apply to each value
 * @param concurrency - Maximum number of concurrent operations
 * @returns Transformer function that concurrently applies the function and yields the original values
 */
function concurrentTap<T>(
  f: (value: T, index: number, worker: number) => void | Promise<void>,
  concurrency: number,
  signal: undefined | AbortSignal
) {
  return async function* (values: AsyncIterable<T>) {
    // Before touching the source: creating the input channel pulls its first value.
    signal?.throwIfAborted()
    let index = 0
    const input = Ch.ofAsyncIterable<T>(values)
    const output = Ch.of<T>()
    const detach = abortConcurrent(signal, input, output)
    pool(input, output, concurrency, async (value, worker) => {
      await Promise.resolve(f(value, index++, worker))
      await output.write(value)
    })
    try {
      yield* output
    } finally {
      detach()
      if (!input.doneWriting) {
        input.close()
      }
    }
  }
}

/**
 * Creates a transformer that applies a function to each value without changing the values.
 *
 * @description
 * The tap function is used for side effects while processing an async iterable. It applies
 * the provided function to each value but yields the original values unchanged.
 * Supports concurrent processing with configurable concurrency.
 *
 * @param f - Side-effect function to apply to each value
 * @param options - Configuration options
 * @param options.concurrency - Number of concurrent operations (default: 1)
 * @param options.signal - Aborting makes the transformer throw `signal.reason` and stop pulling from
 *   the source; a call of `f` already in flight is left to settle on its own
 * @returns A transformer function that yields the original values after applying the function
 *
 * @example
 * ```ts
 * // Log values as they pass through
 * const result = await G.pipe(
 *   G.ofIterable([1, 2, 3, 4, 5]),
 *   G.tap(value => console.log(`Processing: ${value}`)),
 *   G.array
 * ); // [1, 2, 3, 4, 5]
 *
 * // Process values concurrently
 * const result = await G.pipe(
 *   G.ofIterable([1, 2, 3, 4, 5]),
 *   G.tap(async value => {
 *     await longRunningOperation(value);
 *   }, { concurrency: 3 }),
 *   G.array
 * );
 * ```
 */
export function tap<T>(
  f: (value: T, index: number, worker: number) => void | Promise<void>,
  { concurrency = 1, signal }: { concurrency?: number, signal?: AbortSignal } = {}
) {
  assertConcurrency(concurrency)
  return concurrency === 1 ?
    serialTap(f, signal) :
    concurrentTap(f, concurrency, signal)
}
