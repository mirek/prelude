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
 *
 * @param options.signal - aborting clears the pending timer and makes the generator throw `signal.reason`.
 */
const midSeconds =
  async function* (remoteClock: RemoteClock, { signal }: { signal?: AbortSignal } = {}): AsyncGenerator<number> {
    // A consumer that breaks out of `for await` only returns the generator once the pending
    // sleep resolves; aborting the signal cuts that sleep short (the generator then throws
    // `signal.reason`) and clears the timer.
    while (true) {
      await sleep(nextMidSecondOffset(remoteClock), signal)
      yield now(remoteClock)
    }
  }

export default midSeconds
