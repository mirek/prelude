import type { RemoteClock } from './prelude.js'

/**
 * @returns remote clock. Without a measurement the placeholder is unsynchronised (`samples: 0`):
 * offset 0 until the first {@link record}, which replaces it rather than blending with it.
 */
const of =
  (measurement?: { before?: number, remote?: number, after?: number }): RemoteClock => ({
    before: measurement?.before ?? 0,
    remote: measurement?.remote ?? 1 * 1000,
    after: measurement?.after ?? 2 * 1000,
    samples: measurement === undefined ? 0 : 1
  })

export default of
