import * as Ch from '@prelude/channel'
import assertConcurrency from './assert-concurrency.js'
import type { Transformer } from './prelude.js'
import pool from './pool.js'
import withIndex from './with-index.js'

type F<T, R> = (value: T, index: number, worker: number) => R

/**
 * Serial implementation of map transformation.
 *
 * @internal
 * @param f - Mapping function
 * @returns Transformer function for mapping values serially
 */
function serial<T, R>(f: F<T, R>): Transformer<T, Awaited<R>> {
  return async function* (values: AsyncIterable<T>) {
    let index = 0
    for await (const value of values) {
      yield await f(value, index++, 0)
    }
  }
}

/**
 * Unordered concurrent implementation of map transformation.
 *
 * @internal
 * @param f - Mapping function
 * @param concurrency - Maximum number of concurrent operations
 * @returns Transformer function for mapping values concurrently without preserving order
 */
function unordered<T, R>(f: F<T, R>, concurrency: number): Transformer<T, Awaited<R>> {
  return async function* (values: AsyncIterable<T>) {
    let index = 0
    const input = Ch.ofAsyncIterable(values)
    const output = Ch.of<Awaited<R>>()
    pool(input, output, concurrency, async (value, worker) => {
      await output.write(await f(value, index++, worker))
    })
    try {
      yield* output
    } finally {
      if (!input.doneWriting) {
        input.close()
      }
    }
  }
}

/**
 * Ordered concurrent implementation of map transformation.
 *
 * @internal
 * @param f - Mapping function
 * @param concurrency - Maximum number of concurrent operations
 * @returns Transformer function for mapping values concurrently while preserving order
 */
function ordered<T, R>(f: F<T, R>, concurrency: number): Transformer<T, Awaited<R>> {
  return async function* (values: AsyncIterable<T>) {
    let index = 0
    const input = Ch.ofAsyncIterable(withIndex(values))
    const output = Ch.of<Awaited<R>>()

    // Results are written to the (unbuffered) output in input order: a worker holding result i
    // waits for its turn, so a slow head-of-line item blocks the workers behind it instead of
    // letting them drain the source and buffer results without bound.
    let turn = 0
    let released = false
    const waiters = new Map<number, () => void>()
    const waitTurn =
      (i: number) =>
        i === turn || released ?
          Promise.resolve() :
          new Promise<void>(resolve => waiters.set(i, resolve))
    const advance =
      () => {
        turn++
        const waiter = waiters.get(turn)
        if (waiter) {
          waiters.delete(turn)
          waiter()
        }
      }
    // Once the output is closed (completion, failure or the consumer stopping) nobody's turn will come.
    output.onceDoneWriting(() => {
      released = true
      for (const waiter of waiters.values()) {
        waiter()
      }
      waiters.clear()
    })

    pool(input, output, concurrency, async (value, worker) => {
      const result = await f(value.value, index++, worker)
      await waitTurn(value.index)
      if (released) {
        return
      }
      try {
        await output.write(result)
      } finally {
        advance()
      }
    })
    try {
      yield* output
    } finally {
      if (!input.doneWriting) {
        input.close()
      }
    }
  }
}

/**
 * Creates a transformer that maps each value using the provided function.
 *
 * @description
 * Applies a mapping function to each value in an async iterable, with support for
 * concurrent processing and order preservation.
 *
 * @param f - Function to apply to each value, receiving the value, its index, and worker number
 * @param options - Configuration options
 * @param options.concurrency - Number of concurrent operations (default: 1)
 * @param options.preserveOrder - Whether to preserve the original order (default: true)
 * @returns A transformer function that yields the mapped values
 *
 * @example
 * ```ts
 * // Serial mapping (default)
 * const doubled = await G.pipe(
 *   G.ofIterable([1, 2, 3]),
 *   G.map(x => x * 2),
 *   G.array
 * ); // [2, 4, 6]
 *
 * // Concurrent mapping with preserved order
 * const results = await G.pipe(
 *   G.ofIterable([1, 2, 3, 4, 5]),
 *   G.map(async x => {
 *     await sleep(100);
 *     return x * 2;
 *   }, { concurrency: 3 }),
 *   G.array
 * ); // [2, 4, 6, 8, 10]
 * ```
 */
export function map<T, R>(f: F<T, R>, { concurrency = 1, preserveOrder = true }: {
  concurrency?: number,
  preserveOrder?: boolean
} = {}): Transformer<T, Awaited<R>> {
  assertConcurrency(concurrency)
  if (concurrency === 1) {
    return serial(f)
  }
  if (!preserveOrder) {
    return unordered(f, concurrency)
  }
  return ordered(f, concurrency)
}
