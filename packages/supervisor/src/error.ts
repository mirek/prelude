/** Codes carried by {@link SupervisorError}. */
export type Code =
  | 'restarts'
  | 'stopped'
  | 'killed'
  | 'invalid'

/** Error raised by the supervisor itself. `cause` carries the child failure that triggered it. */
export class SupervisorError extends Error {

  readonly code: Code

  constructor(message: string, code: Code, options?: ErrorOptions) {
    super(message, options)
    this.name = 'SupervisorError'
    this.code = code
  }

}

export default SupervisorError
