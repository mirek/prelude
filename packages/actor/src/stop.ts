import type { Actor } from './prelude.js'

export const stop =
  async <M, S>(actor: Actor<M, S>): Promise<void> => {
    if (!actor.inbox.doneWriting) {
      actor.inbox.closeWriting()
    }
    await actor.running
  }

export default stop
