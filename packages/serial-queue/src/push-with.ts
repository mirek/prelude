import type { SerialQueue } from './prelude.js'
import next from './next.js'
import notifyDrained from './notify-drained.js'

export type PushOptions = {
  /**
   * Aborting removes the entry from the queue and rejects its promise with
   * `signal.reason`. An entry that is already running keeps running — `f`
   * cannot be interrupted — but its eventual result is dropped, exactly as
   * after `rejectAll`. A signal that is already aborted rejects without
   * queueing anything.
   */
  signal?: AbortSignal
}

/** Like `push`, with options; see {@link PushOptions}. */
export const pushWith =
  <Args extends unknown[], R>(queue: SerialQueue<Args, R>, { signal }: PushOptions, ...args: Args): Promise<R> =>
    new Promise<R>((resolve, reject) => {
      if (signal?.aborted) {
        reject(signal.reason)
        return
      }
      const entry = {
        args,
        resolve: (value: R | PromiseLike<R>) => {
          signal?.removeEventListener('abort', onAbort)
          resolve(value)
        },
        reject: (err: unknown) => {
          signal?.removeEventListener('abort', onAbort)
          reject(err)
        }
      }
      const onAbort =
        () => {
          const i = queue.entries.indexOf(entry)
          if (i !== -1) {
            queue.entries.splice(i, 1)
            if (queue.entries.length === 0) {
              notifyDrained(queue)
            }
          }
          reject(signal!.reason)
        }
      signal?.addEventListener('abort', onAbort, { once: true })
      if (queue.entries.push(entry) === 1 && !queue.running) {
        next(queue)
      }
    })

export default pushWith
