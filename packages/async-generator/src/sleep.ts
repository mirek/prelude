/**
 * Creates a promise that resolves after a specified delay.
 *
 * @param milliseconds - The time to delay in milliseconds
 * @param options.signal - Aborting clears the timer and rejects with `signal.reason`
 * @returns A promise that resolves after the specified delay
 *
 * @example
 * ```ts
 * // Delay execution for 1 second
 * await sleep(1000);
 * ```
 */
export function sleep(milliseconds: number, { signal }: { signal?: AbortSignal } = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason)
      return
    }
    const onAbort =
      () => {
        clearTimeout(id)
        reject(signal!.reason)
      }
    const id = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, milliseconds)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

export default sleep
