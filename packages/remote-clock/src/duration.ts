import type { RemoteClock } from './prelude.js'

/** @returns min/max-capped duration. */
const duration =
  ({ before, after }: Pick<RemoteClock, 'before' | 'after'>, min = 1, max = 60 * 1000): number =>
    Math.max(Math.min(max, after - before), min)

export default duration
