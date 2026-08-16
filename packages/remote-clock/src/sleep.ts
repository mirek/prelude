/** Resolves after `milliseconds`; aborting `signal` clears the timer and rejects with `signal.reason`. */
const sleep =
  (milliseconds: number, signal?: AbortSignal): Promise<void> =>
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
      }, milliseconds)
      signal?.addEventListener('abort', onAbort, { once: true })
    })

export default sleep
