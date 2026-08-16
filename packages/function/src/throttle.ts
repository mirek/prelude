type Scheduler = {
  setTimeout(callback: () => void, delay: number): unknown
}

const scheduler: Scheduler = {
  setTimeout(callback, delay) {
    return setTimeout(callback, delay)
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
    const g =
      () => {
        if (signal?.aborted) {
          return
        }
        if (n++ === 0) {
          schedule.setTimeout(() => {
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
