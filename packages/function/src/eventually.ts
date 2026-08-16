import sleep from './sleep.js'

/** Settles like `promise` or rejects with `signal.reason` on abort; a later outcome of `promise` is dropped. */
const raceAbort =
  <T>(promise: Promise<T>, signal: undefined | AbortSignal): Promise<T> => {
    if (!signal) {
      return promise
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
 * Repeatedly run `f` until `predicate` holds for its result.
 *
 * `retry(n, duration)` is consulted exactly once per candidate attempt with
 * the zero-based attempt index and the elapsed milliseconds at which that
 * attempt would start (i.e. including the `delay` before it), so a stateful
 * predicate can count attempts and a duration-based one is not overshot by
 * the delay. When it refuses, no further `sleep` happens and `reject`
 * receives an `Error` reporting the number of attempts actually made.
 */
const eventually =
  async <T, U>(
    f: () => Promise<T>,
    {
      retry = _ => _ < 10,
      delay = 1000,
      predicate = _ => Boolean(_),
      reject = _ => { throw _ },
      signal
    }: {
      delay?: number,
      retry?: (n: number, duration: number) => boolean,
      predicate?: (value: T | U) => boolean,
      reject?: (err: unknown) => U,
      /**
       * Aborting rejects the returned promise with `signal.reason` at once
       * (not through `reject`): a pending delay is cut short, no further
       * attempt starts, and an attempt already in flight is left to settle on
       * its own with its outcome dropped — pass the same signal to `f` when
       * its work should stop too.
       */
      signal?: AbortSignal
    } = {}
  ): Promise<T | U> => {
    signal?.throwIfAborted()
    const before = Date.now()
    let i = 0
    let again = retry(i, 0)
    while (again) {
      // The attempt is raced against the signal: an abort rejects at once and the attempt's
      // eventual outcome is dropped (and never left as an unhandled rejection).
      const r = await raceAbort(f().catch(reject), signal)
      if (predicate(r)) {
        return r
      }
      signal?.throwIfAborted()
      // Ask once whether another attempt will be made — at the time it would actually start,
      // so a duration-based predicate sees the delay — and only then wait.
      again = retry(++i, Date.now() - before + delay)
      if (again) {
        await sleep(delay, { signal })
      }
    }
    return reject(new Error(`Expected predicate to hold within ${i} attempt(s).`))
  }

export default eventually
