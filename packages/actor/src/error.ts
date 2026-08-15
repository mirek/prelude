/** Codes carried by {@link ActorError}. */
export type Code =
  | 'stopped'
  | 'killed'
  | 'restarted'
  | 'timeout'
  | 'aborted'
  | 'invalid'

/** Error raised by the actor runtime itself, as opposed to errors thrown by handlers. */
export class ActorError extends Error {

  readonly code: Code

  constructor(message: string, code: Code, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ActorError'
    this.code = code
  }

}

export default ActorError
