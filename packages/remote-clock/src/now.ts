import type { RemoteClock } from './prelude.js'
import offset from './offset.js'

/** @returns remote timestamp in milliseconds. Like `Date.now()` but for remote/tracked clock. */
const now =
  (remoteClock: RemoteClock, now_ = Date.now()): number =>
    now_ + offset(remoteClock)

export default now
