import * as Channel from '@prelude/channel'
import type { Actor, Handler } from './prelude.js'

export const of =
  <M, S>(state: S, handler: Handler<S, M>, cap = Infinity): Actor<M, S> => ({
    inbox: Channel.of<M>(cap),
    state,
    handler
  })

export default of
