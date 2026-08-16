import type { Transformer } from './prelude.js'
import sleep from './sleep.js'

/**
 * Creates a transformer that adds random time delays between yielded values.
 *
 * @description
 * This function yields the first value immediately and waits a random amount of time
 * before each following value; nothing is waited after the last one.
 * The delay consists of a fixed component plus a random component.
 *
 * @param jitter_ - Maximum random delay in milliseconds to add to the base delay
 * @param delay - Base delay in milliseconds to apply between values (default: 0)
 * @param options.signal - Aborting cuts a pending delay short and makes the transformer throw `signal.reason`
 * @returns A transformer that passes through all values with time delays between them
 *
 * @example
 * ```ts
 * // Yield values with 100-600ms delays between them
 * const throttled = await G.pipe(
 *   G.ofIterable([1, 2, 3, 4, 5]),
 *   G.jitter(500, 100),
 *   G.array
 * );
 * ```
 */
export function jitter<T>(jitter_: number, delay = 0, { signal }: { signal?: AbortSignal } = {}): Transformer<T> {
  return async function* (values) {
    // Sleep between values, not after the last one: a trailing delay only holds up completion.
    let first = true
    signal?.throwIfAborted()
    for await (const value of values) {
      if (!first) {
        await sleep(delay + (Math.random() * jitter_), { signal })
      }
      first = false
      yield value
    }
  }
}
