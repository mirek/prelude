import sleep from './sleep.js'

/**
 * Repeatedly run `f` until `predicate` holds for its result.
 *
 * `retry(n, duration)` is consulted exactly once per candidate attempt,
 * before it is made, with the zero-based attempt index and the elapsed
 * milliseconds; a stateful predicate can therefore count attempts. When it
 * refuses, no further `sleep` happens and `reject` receives an `Error`
 * reporting the number of attempts actually made.
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
      // Ask once whether another attempt will be made and only then wait.
      again = retry(++i, Date.now() - before)
      if (again) {
        await sleep(delay)
      }
    }
    return reject(new Error(`Expected predicate to hold within ${i} attempt(s).`))
  }

export default eventually
