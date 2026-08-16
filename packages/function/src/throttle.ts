type Scheduler = {
  setTimeout(callback: () => void, delay: number): unknown,
  /** Optional; without it an aborted throttle lets its pending timer run out (the callback is a no-op by then). */
  clearTimeout?(handle: unknown): void
}

const scheduler: Scheduler = {
  setTimeout(callback, delay) {
    return setTimeout(callback, delay)
  },
  clearTimeout(handle) {
    clearTimeout(handle as ReturnType<typeof setTimeout>)
  }
}

/**
 * Returns a function that calls `f` at most once per `wait` milliseconds:
 * the first call runs immediately, calls during the window are coalesced into
 * one trailing call.
 *
 * Aborting `signal` drops the pending trailing call and makes further calls
 * no-ops; a call after abort never reaches `f`.
 */
const throttle =
  (wait: number, f: () => void, schedule: Scheduler = scheduler, { signal }: { signal?: AbortSignal } = {}) => {
    let n = 0
    let handle: unknown
    signal?.addEventListener('abort', () => {
      // Drop the pending trailing call and release the timer right away.
      n = 0
      schedule.clearTimeout?.(handle)
      handle = undefined
    }, { once: true })
    const g =
      () => {
        if (signal?.aborted) {
          return
        }
        if (n++ === 0) {
          handle = schedule.setTimeout(() => {
            handle = undefined
            if (--n > 0) {
              n = 0
              g()
            }
          }, wait)
          f()
        }
      }
    return g
  }

export default throttle
