import duration from './duration.js'
import interpolate from './interpolate.js'
import type { RemoteClock } from './prelude.js'

/** Records measurement by merging it onto remote clock. */
const record =
  (remoteClock: RemoteClock, measurement: RemoteClock): void => {
    if (remoteClock.samples === 0) {
      // Nothing real to blend with yet: adopt the first measurement as is.
      remoteClock.before = measurement.before
      remoteClock.remote = measurement.remote
      remoteClock.after = measurement.after
      remoteClock.samples = 1
      return
    }
    remoteClock.samples = (remoteClock.samples ?? 1) + 1
    const remoteDuration = duration(remoteClock)
    const measurementDuration = duration(measurement)
    const measurementWeight = 1 - (measurementDuration / (remoteDuration + measurementDuration))
    remoteClock.before = interpolate(remoteClock.before, measurement.before, measurementWeight)
    remoteClock.remote = interpolate(remoteClock.remote, measurement.remote, measurementWeight)
    remoteClock.after = interpolate(remoteClock.after, measurement.after, measurementWeight)
  }

export default record
