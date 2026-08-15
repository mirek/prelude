import type { SerialQueue } from './prelude.js'

/**
 * Runs the head entry. The queue advances (and the next entry starts) *before*
 * the head's promise settles, so anyone resuming on that settlement observes a
 * consistent queue and does not depend on microtask ordering.
 */
const next =
  <Args extends unknown[], R>(queue: SerialQueue<Args, R>): void => {
    const entry = queue.entries[0]
    if (!entry) {
      return
    }
    const settle =
      (f: () => void) => {
        // `rejectAll` may already have removed this entry.
        if (queue.entries[0] === entry) {
          queue.entries.shift()
          if (queue.entries.length > 0) {
            next(queue)
          } else {
            queue.drained?.()
          }
        }
        f()
      }
    let result: Promise<R>
    try {
      result = queue.f(...entry.args)
    } catch (err) {
      settle(() => entry.reject(err))
      return
    }
    Promise
      .resolve(result)
      .then(
        value => settle(() => entry.resolve(value)),
        (err: unknown) => settle(() => entry.reject(err))
      )
  }

export default next
