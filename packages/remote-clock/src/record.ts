import duration from './duration.js'
import interpolate from './interpolate.js'
import type { RemoteClock } from './prelude.js'

/** Records measurement by merging it onto remote clock. */
const record =
  (remoteClock: RemoteClock, measurement: RemoteClock): void => {
    const remoteDuration = duration(remoteClock)
    const measurementDuration = duration(measurement)
    const measurementWeight = 1 - (measurementDuration / (remoteDuration + measurementDuration))
    remoteClock.before = interpolate(remoteClock.before, measurement.before, measurementWeight)
    remoteClock.remote = interpolate(remoteClock.remote, measurement.remote, measurementWeight)
    remoteClock.after = interpolate(remoteClock.after, measurement.after, measurementWeight)
  }

export default record
