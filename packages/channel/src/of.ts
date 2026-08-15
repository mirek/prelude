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
 * @returns A channel that closes after the iterable is exhausted, or fails if iteration throws.
 */
export function ofIterable<T>(iterable: Iterable<T>, cap = 0) {
  const ch = new Channel<T>(cap)
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
 * @returns A channel that closes after the async iterable is exhausted, or fails if iteration throws.
 */
export function ofAsyncIterable<T>(asyncIterable: AsyncIterable<T>, cap = 0) {
  const ch = new Channel<T>(cap)
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
