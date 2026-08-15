export type RemoteClock = {
  before: number,
  remote: number,
  after: number,
  /**
   * Number of measurements merged so far. `0` marks a clock created without a measurement
   * (`of()`), whose placeholder sample is replaced by the first real one instead of blended.
   * Absent means at least one (a clock built from a real measurement).
   */
  samples?: number
}

/**
 * Keeps track of remote clock.
 * Lower latency measurements get higher weight.
 * Eventually arrives at best effort clock sync.
 */
export type t = RemoteClock
