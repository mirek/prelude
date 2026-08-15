import type { Entry, SerialQueue } from './prelude.js'

/**
 * Runs the head entry. The queue advances (and the next entry starts) *before*
 * the head's promise settles, so anyone resuming on that settlement observes a
 * consistent queue and does not depend on microtask ordering.
 *
 * Entries whose `f` throws synchronously are rejected and the queue advances in
 * a loop rather than by recursion, so long runs of failing entries cannot
 * overflow the stack.
 */
const next =
  <Args extends unknown[], R>(queue: SerialQueue<Args, R>): void => {
    while (true) {
      const entry: undefined | Entry<Args, R> = queue.entries[0]
      if (!entry || queue.running) {
        return
      }
      const settle =
        (f: () => void) => {
          queue.running = undefined
          // `rejectAll` may already have removed this entry.
          if (queue.entries[0] === entry) {
            queue.entries.shift()
            if (queue.entries.length > 0) {
              next(queue)
            } else {
              queue.drained?.()
            }
          } else if (queue.entries.length > 0) {
            // Entries pushed after `rejectAll` while this one was still running.
            next(queue)
          }
          f()
        }
      queue.running = entry
      let result: Promise<R>
      try {
        result = queue.f(...entry.args)
      } catch (err) {
        queue.running = undefined
        if (queue.entries[0] === entry) {
          queue.entries.shift()
          if (queue.entries.length === 0) {
            queue.drained?.()
          }
        }
        entry.reject(err)
        continue
      }
      Promise
        .resolve(result)
        .then(
          value => settle(() => entry.resolve(value)),
          (err: unknown) => settle(() => entry.reject(err))
        )
      return
    }
  }

export default next
