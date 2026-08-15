import type { Ref } from '@prelude/actor'
import type { Frame, ServeOptions, Transport } from './prelude.js'
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
        const post = (reply: Frame) => Promise.resolve().then(() => transport.post(reply))
        void actor
          .ask(frame.message as M)
          .then(
            value => post({ type: 'reply', id, value }),
            (error: unknown) => post({ type: 'error', id, error: serialize(error) })
          )
          // The reply itself could not be delivered (e.g. a value that cannot be structured-cloned):
          // report that instead of leaving the caller's ask pending forever.
          .catch((error: unknown) => post({ type: 'error', id, error: serialize(error) }))
          .catch(() => {})
        return
      }
      default:
        return
    }
  })
}

export default serve
