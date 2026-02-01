import type { RemoteClock } from './prelude.js'

const of =
  ({
    before = 0,
    remote = 1 * 1000,
    after = 2 * 1000
  } = {}): RemoteClock => ({
    before,
    remote,
    after
  })

export default of
