import * as Log from '@prelude/log'

declare function setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): number

declare function clearTimeout(timeoutId: number): void

const log = Log.of('@prelude/emitter:after')

export { log as afterLog }

/** Largest delay `setTimeout` accepts; anything above is clamped to ~1ms with a TimeoutOverflowWarning. */
const maxDelay = 2_147_483_647

/**
 * Calls `callback` after `milliseconds` delay.
 * Delays above the `setTimeout` maximum (2^31-1 ms) are honoured by chaining timers.
 * @param milliseconds - Delay in milliseconds before callback is executed
 * @param callback - Function to call after the delay
 * @returns Cancellation function that prevents the callback from being called
 */
export const after =
  (milliseconds: number, callback: () => void) => {
    // A non-finite delay means never.
    if (!Number.isFinite(milliseconds)) {
      return () => {}
    }
    let id: null | ReturnType<typeof setTimeout> = null
    let remaining = milliseconds
    const schedule = () => {
      if (remaining > maxDelay) {
        remaining -= maxDelay
        id = setTimeout(schedule, maxDelay)
      } else {
        id = setTimeout(callback, remaining)
      }
    }
    schedule()
    return () => {
      if (id == null) {
        log.warn('Expected off function to be called at most once.')
        return
      }
      clearTimeout(id)
      id = null
    }
  }

export default after
