import type { SerialQueue } from './prelude.js'

/**
 * Runs the `drained` hook, if any. The hook is a notification and must not be
 * able to break the queue: an exception it throws is rethrown asynchronously
 * (as an uncaught exception, like a throwing timer or event listener) instead
 * of escaping into `push`, `rejectAll` or the internal settlement chain, where
 * it would leave entries pending or surface as an unhandled rejection.
 */
const notifyDrained =
  <Args extends unknown[], R>(queue: SerialQueue<Args, R>): void => {
    try {
      queue.drained?.()
    } catch (err) {
      queueMicrotask(() => { throw err })
    }
  }

export default notifyDrained
