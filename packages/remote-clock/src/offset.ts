import type { RemoteClock } from './prelude.js'

/** @returns offset from remote/tracked clock. */
const offset =
  ({ before, after, remote: now }: RemoteClock): number =>
    ((before + after) / 2) - now

export default offset
