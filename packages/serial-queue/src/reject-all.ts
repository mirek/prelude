import type { SerialQueue } from './prelude.js'
import notifyDrained from './notify-drained.js'

export const rejectAll =
  <Args extends unknown[], R>(queue: SerialQueue<Args, R>, err: unknown): void => {
    if (queue.entries.length === 0) {
      return
    }
    while (queue.entries.length > 0) {
      queue.entries.shift()?.reject(err)
    }

    // Make sure previous pending settlements don't impact "new" queue.
    queue.entries = []

    notifyDrained(queue)
  }

export default rejectAll
