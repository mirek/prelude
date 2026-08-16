import type { RemoteClock } from './prelude.js'
import nextMidSecondOffset from './next-mid-second-offset.js'
import now from './now.js'

/** Like {@link @prelude/remote-clock#midSeconds} but with {@link setInterval}-like api. */
const midSecondsInterval =
  (remoteClock: RemoteClock, callback: (now_: number) => void, { signal }: { signal?: AbortSignal } = {}): (() => void) => {
    let id: undefined | ReturnType<typeof setTimeout>
    const stop =
      () => {
        clearTimeout(id)
        id = undefined
        signal?.removeEventListener('abort', stop)
      }
    if (signal?.aborted) {
      return stop
    }
    const tick =
      () => {
        id = setTimeout(tick, nextMidSecondOffset(remoteClock))
        callback(now(remoteClock))
      }
    id = setTimeout(tick, nextMidSecondOffset(remoteClock))
    // Aborting stops the ticks like calling the returned function does.
    signal?.addEventListener('abort', stop, { once: true })
    return stop
  }

export default midSecondsInterval
