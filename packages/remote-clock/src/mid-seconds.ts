import type { RemoteClock } from './prelude.js'
import nextMidSecondOffset from './next-mid-second-offset.js'
import now from './now.js'
import sleep from './sleep.js'

/**
 * Generates remote now, every second, in the middle of a second.
 *
 * @usage
 *   for await (const now of RemoteClock.midSeconds(remoteClock)) {
 *     console.log('local:', new Date().toISOString(), 'remote:', new Date(now).toISOString())
 *   }
 */
const midSeconds =
  async function* (remoteClock: RemoteClock): AsyncGenerator<number> {
    while (true) {
      await sleep(nextMidSecondOffset(remoteClock))
      yield now(remoteClock)
    }
  }

export default midSeconds
