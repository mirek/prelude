/** Largest delay `setTimeout` accepts; anything above is clamped to ~1ms with a TimeoutOverflowWarning. */
const maxDelay = 2_147_483_647

/**
 * Resolves with the result of `f`, or with the result of `g` if `f` does not settle within `wait` milliseconds.
 * Waits above the `setTimeout` maximum (2^31-1 ms) are honoured by chaining timers; a non-finite wait never times out.
 */
const timeout =
  <T, U>(wait: number, f: () => Promise<T>, g: () => U): Promise<T | U> =>
    new Promise((resolve, reject) => {
      let id: undefined | ReturnType<typeof setTimeout>
      let remaining = wait
      const schedule = () => {
        if (remaining > maxDelay) {
          remaining -= maxDelay
          id = setTimeout(schedule, maxDelay)
        } else {
          id = setTimeout(() => {
            try {
              resolve(g())
            } catch (err: unknown) {
              reject(err)
            }
          }, remaining)
        }
      }
      if (Number.isFinite(wait)) {
        schedule()
      }
      let pending: Promise<T>
      try {
        pending = f()
      } catch (err: unknown) {
        // A synchronous throw must not leave the timer running (g would still fire later).
        clearTimeout(id)
        reject(err)
        return
      }
      pending
        .finally(() => clearTimeout(id))
        .then(resolve)
        .catch(reject)
    })

export default timeout
