import { Channel } from './channel.js'

/**
 * Creates a channel that closes after a specified time in milliseconds.
 * @typeparam T - The type of values in the channel. Defaults to `unknown`.
 * @param milliseconds - The time in milliseconds after which to close the channel.
 * @returns A channel that closes automatically after the specified time.
 */
export function after<T = unknown>(milliseconds: number) {
  const ch = new Channel<T>()
  const timeoutId = setTimeout(() => ch.closeWriting(), milliseconds)
  ch.onceDoneWriting(() => clearTimeout(timeoutId))
  return ch
}
