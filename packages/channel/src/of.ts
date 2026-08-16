import { Channel } from './channel.js'

/**
 * Creates a channel from a value.
 * @typeparam T - The type of values in the channel.
 * @param cap - Maximum number of pending writes. Defaults to 0.
 * @returns A new channel.
 */
export function of<T>(cap = 0) {
  return new Channel<T>(cap)
}

/**
 * Creates a channel from an iterable.
 * @typeparam T - The type of values in the channel.
 * @param iterable - The iterable to stream values from.
 * @param cap - Maximum number of pending writes. Defaults to 0.
 * @param options.signal - Aborting fails the channel with `signal.reason` and stops the producer.
 * @returns A channel that closes after the iterable is exhausted, or fails if iteration throws.
 */
/**
 * Fails `ch` with `signal.reason` when `signal` aborts, until `ch` is done writing.
 * The producer notices on its next write (which rejects) and stops.
 */
const failOnAbort =
  (ch: Pick<Channel<unknown>, 'fail' | 'onceDoneWriting'>, signal: undefined | AbortSignal) => {
    if (!signal) {
      return
    }
    const onAbort = () => ch.fail(signal.reason)
    if (signal.aborted) {
      onAbort()
      return
    }
    signal.addEventListener('abort', onAbort, { once: true })
    ch.onceDoneWriting(() => signal.removeEventListener('abort', onAbort))
  }

export function ofIterable<T>(iterable: Iterable<T>, cap = 0, { signal }: { signal?: AbortSignal } = {}) {
  const ch = new Channel<T>(cap)
  failOnAbort(ch, signal)
  const produce =
    async () => {
      for (const value of iterable) {
        if (ch.doneWriting) {
          break
        }
        await Promise
          .resolve()
          .then(() => ch.write(value))
      }
    }
  void produce()
    .then(() => {
      if (!ch.doneWriting) {
        ch.closeWriting()
      }
    }, err => {
      // A write rejected because the consumer closed the channel is not a producer failure.
      ch.fail(err)
    })
  return ch
}

/**
 * Creates a channel from an async iterable.
 * @typeparam T - The type of values in the channel.
 * @param asyncIterable - The async iterable to stream values from.
 * @param cap - Maximum number of pending writes. Defaults to 0.
 * @param options.signal - Aborting fails the channel with `signal.reason` and stops the producer after
 *   its in-flight pull; the interrupted `for await` returns the source iterator.
 * @returns A channel that closes after the async iterable is exhausted, or fails if iteration throws.
 */
export function ofAsyncIterable<T>(asyncIterable: AsyncIterable<T>, cap = 0, { signal }: { signal?: AbortSignal } = {}) {
  const ch = new Channel<T>(cap)
  failOnAbort(ch, signal)
  const produce =
    async () => {
      for await (const value of asyncIterable) {
        if (ch.doneWriting) {
          break
        }
        await ch.write(value)
      }
    }
  void produce()
    .then(() => {
      if (!ch.doneWriting) {
        ch.closeWriting()
      }
    }, err => {
      // A write rejected because the consumer closed the channel is not a producer failure.
      ch.fail(err)
    })
  return ch
}
