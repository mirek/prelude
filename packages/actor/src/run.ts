import type { Actor } from './prelude.js'

export const run =
  <M, S>(actor: Actor<M, S>): Promise<void> => {
    if (actor.running) {
      return actor.running
    }
    actor.running = (async () => {
      for await (const message of actor.inbox) {
        await actor.handler(actor.state, message)
      }
    })()
    return actor.running
  }

export default run
