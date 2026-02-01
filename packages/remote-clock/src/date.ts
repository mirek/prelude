import now from './now.js'
import type { RemoteClock } from './prelude.js'

/** @returns remote `Date`. */
const date =
  (remoteClock: RemoteClock, now_ = Date.now()): Date =>
    new Date(now(remoteClock, now_))

export default date
