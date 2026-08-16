import { Channel } from './channel.js'

/** Largest delay `setTimeout` accepts; anything above is clamped to ~1ms with a TimeoutOverflowWarning. */
const maxDelay = 2_147_483_647

/**
 * Creates a channel that closes after a specified time in milliseconds.
 * Delays above the `setTimeout` maximum (2^31-1 ms) are honoured by chaining timers; a non-finite delay never closes.
 * @typeparam T - The type of values in the channel. Defaults to `unknown`.
 * @param milliseconds - The time in milliseconds after which to close the channel.
 * @returns A channel that closes automatically after the specified time.
 */
export function after<T = unknown>(milliseconds: number) {
  const ch = new Channel<T>()
  if (!Number.isFinite(milliseconds)) {
    return ch
  }
  let timeoutId: ReturnType<typeof setTimeout>
  // Chain from an absolute deadline so a late chunk (event-loop lag, process suspension)
  // does not push the close out by the accumulated lateness.
  const deadline = Date.now() + milliseconds
  const schedule = () => {
    const remaining = deadline - Date.now()
    if (remaining > maxDelay) {
      timeoutId = setTimeout(schedule, maxDelay)
    } else {
      timeoutId = setTimeout(() => ch.closeWriting(), Math.max(0, remaining))
    }
  }
  schedule()
  ch.onceDoneWriting(() => clearTimeout(timeoutId))
  return ch
}
