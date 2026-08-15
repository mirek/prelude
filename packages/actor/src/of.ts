import { Actor } from './actor.js'
import type { Options, Receive } from './prelude.js'

/**
 * Creates an actor.
 * @param init - Creates the initial state; also called on restart.
 * @param receive - Message handler; its return value is the reply for `ask`.
 * @param options - Remaining {@link Options}.
 */
export function of<M, S = undefined, R = void>(
  init: () => S,
  receive: Receive<M, S, R>,
  options: Omit<Options<M, S, R>, 'init' | 'receive'> = {}
): Actor<M, S, R> {
  return new Actor<M, S, R>({ ...options, init, receive })
}

export default of
