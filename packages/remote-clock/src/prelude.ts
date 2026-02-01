export type RemoteClock = {
  before: number,
  remote: number,
  after: number
}

/**
 * Keeps track of remote clock.
 * Lower latency measurements get higher weight.
 * Eventually arrives at best effort clock sync.
 */
export type t = RemoteClock
