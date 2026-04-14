import type { Actor } from './prelude.js'

export const send =
  <M, S>(actor: Actor<M, S>, message: M): Promise<void> =>
    actor.inbox.write(message)

export default send
