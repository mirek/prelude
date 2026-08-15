import type { SerializedError } from './prelude.js'

/** Codes carried by {@link RemoteError}. */
export type Code =
  | 'remote'
  | 'closed'

/**
 * Error raised on the calling side of a remote actor. `code: 'remote'` wraps
 * an error thrown by the remote handler (see {@link RemoteError.remote});
 * `code: 'closed'` means the connection was closed before a reply arrived.
 */
export class RemoteError extends Error {

  readonly code: Code

  /** The remote error as it crossed the wire, when `code` is `'remote'`. */
  readonly remote?: SerializedError

  constructor(message: string, code: Code, remote?: SerializedError) {
    super(message)
    this.name = 'RemoteError'
    this.code = code
    this.remote = remote
  }

}

export default RemoteError
