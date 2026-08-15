import type { Ref } from '@prelude/actor'
import type { ServeOptions, Transport } from './prelude.js'
import { isFrame, serializeError } from './prelude.js'

/**
 * Exposes an actor (or any {@link Ref}) over a transport so a
 * {@link RemoteActor} on the other side can `send` and `ask`.
 * @returns a function that stops serving.
 */
export function serve<M, R>(actor: Ref<M, R>, transport: Transport, options: ServeOptions = {}): () => void {
  const serialize = options.serializeError ?? serializeError
  return transport.subscribe(frame => {
    if (!isFrame(frame)) {
      return
    }
    switch (frame.type) {
      case 'send':
        // Failures (actor stopped, mailbox closed) are dead-lettered on the actor.
        actor.send(frame.message as M).catch(() => {})
        return
      case 'ask': {
        const { id } = frame
        void actor
          .ask(frame.message as M)
          .then(
            value => transport.post({ type: 'reply', id, value }),
            (error: unknown) => transport.post({ type: 'error', id, error: serialize(error) })
          )
          .catch(() => {})
        return
      }
      default:
        return
    }
  })
}

export default serve
