import type { Channel } from '@prelude/channel'

export type Handler<S, M> =
  (state: S, message: M) =>
    Promise<void>

export type Actor<M, S> = {
  inbox: Channel<M>
  state: S
  handler: Handler<S, M>
  running?: Promise<void>
}
