import type { RemoteClock } from './prelude.js'
import nextMidSecondOffset from './next-mid-second-offset.js'
import now from './now.js'

/** Like {@link @prelude/remote-clock#midSeconds} but with {@link setInterval}-like api. */
const midSecondsInterval =
  (remoteClock: RemoteClock, callback: (now_: number) => void): (() => void) => {
    let id: ReturnType<typeof setTimeout>
    const tick =
      () => {
        id = setTimeout(tick, nextMidSecondOffset(remoteClock))
        callback(now(remoteClock))
      }
    id = setTimeout(tick, nextMidSecondOffset(remoteClock)) // eslint-disable-line prefer-const
    return () => {
      clearTimeout(id)
    }
  }

export default midSecondsInterval
