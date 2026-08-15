import type { RemoteClock } from './prelude.js'

/**
 * @returns remote clock offset relative to the local clock, ie. `remote - local` where local is the
 * midpoint of the round trip; adding it to a local timestamp yields the remote timestamp.
 */
const offset =
  ({ before, after, remote: now }: RemoteClock): number =>
    now - ((before + after) / 2)

export default offset
