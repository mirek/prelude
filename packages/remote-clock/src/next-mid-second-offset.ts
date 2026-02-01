import type { RemoteClock } from './prelude.js'
import now from './now.js'

/** @returns number of milliseconds to the next mid-second. */
const nextMidSecondOffset =
  (remoteClock: RemoteClock, now_ = Date.now()) =>
    1000 - ((now(remoteClock, now_) + 500) % 1000)

export default nextMidSecondOffset
