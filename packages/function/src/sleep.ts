/**
 * Resolves after `ms` milliseconds.
 *
 * Aborting `signal` clears the timer and rejects with `signal.reason`; a signal
 * that is already aborted rejects immediately without scheduling anything.
 */
const sleep =
  (ms: number, { signal }: { signal?: AbortSignal } = {}): Promise<void> =>
    new Promise((resolve, reject) => {
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
      }, ms)
      signal?.addEventListener('abort', onAbort, { once: true })
    })

export default sleep
