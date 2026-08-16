/**
 * Settles like `promise`, or rejects with `signal.reason` as soon as `signal`
 * aborts — `promise` itself is left to settle on its own and its outcome is
 * dropped (a later rejection is swallowed so nothing goes unhandled).
 */
export const raceAbort =
  <T>(promise: Promise<T>, signal: undefined | AbortSignal): Promise<T> => {
    if (!signal) {
      return promise
    }
    if (signal.aborted) {
      promise.catch(() => {})
      return Promise.reject(signal.reason)
    }
    return new Promise<T>((resolve, reject) => {
      const onAbort =
        () => {
          promise.catch(() => {})
          reject(signal.reason)
        }
      signal.addEventListener('abort', onAbort, { once: true })
      promise.then(
        value => {
          signal.removeEventListener('abort', onAbort)
          resolve(value)
        },
        (error: unknown) => {
          signal.removeEventListener('abort', onAbort)
          reject(error)
        }
      )
    })
  }

/**
 * Iterates `values` so that an abort takes effect promptly: a pending pull is
 * raced against the signal (the source is returned once that pull settles),
 * and the generator throws `signal.reason`. Without a signal it is `values`.
 */
export async function* abortable<T>(values: AsyncIterable<T>, signal: undefined | AbortSignal): AsyncGenerator<T> {
  if (!signal) {
    yield* values
    return
  }
  signal.throwIfAborted()
  const iterator = values[Symbol.asyncIterator]()
  let pending: undefined | Promise<IteratorResult<T>>
  try {
    while (true) {
      pending = iterator.next()
      const result = await raceAbort(pending, signal)
      pending = undefined
      if (result.done) {
        return
      }
      yield result.value
    }
  } finally {
    // Return the source; if a pull is still in flight (abort won the race), only after it settles —
    // iterators may not accept return() while next() is pending.
    const abandoned = pending
    if (abandoned) {
      abandoned.then(() => iterator.return?.(), () => {}).catch(() => {})
    } else {
      await iterator.return?.()
    }
  }
}

export default abortable
