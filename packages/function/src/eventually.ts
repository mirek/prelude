import sleep from './sleep.js'

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
      reject = _ => { throw _ }
    }: {
      delay?: number,
      retry?: (n: number, duration: number) => boolean,
      predicate?: (value: T | U) => boolean,
      reject?: (err: unknown) => U
    } = {}
  ): Promise<T | U> => {
    const before = Date.now()
    let i = 0
    let again = retry(i, 0)
    while (again) {
      const r = await f().catch(reject)
      if (predicate(r)) {
        return r
      }
      // Ask once whether another attempt will be made — at the time it would actually start,
      // so a duration-based predicate sees the delay — and only then wait.
      again = retry(++i, Date.now() - before + delay)
      if (again) {
        await sleep(delay)
      }
    }
    return reject(new Error(`Expected predicate to hold within ${i} attempt(s).`))
  }

export default eventually
