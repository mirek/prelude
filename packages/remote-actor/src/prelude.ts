/** Wire representation of an error thrown by the remote handler. */
export interface SerializedError {
  readonly name: string
  readonly message: string
  readonly code?: unknown
}

/**
 * Frames exchanged between a {@link RemoteActor} and {@link serve}. Frames are
 * plain data so any transport that can move JSON or structured clones can
 * carry them.
 */
export type Frame =
  | { readonly type: 'send', readonly channel?: string, readonly message: unknown }
  | { readonly type: 'ask', readonly channel?: string, readonly id: number, readonly message: unknown }
  | { readonly type: 'reply', readonly channel?: string, readonly id: number, readonly value: unknown }
  | { readonly type: 'error', readonly channel?: string, readonly id: number, readonly error: SerializedError }

/** A bidirectional, ordered frame carrier: one end of a MessagePort, a socket, a worker… */
export interface Transport {

  /** Delivers a frame to the other side. May be asynchronous (e.g. socket backpressure). */
  post(frame: Frame): void | Promise<void>

  /** Registers a listener for incoming frames. Returns an unsubscribe function. */
  subscribe(listener: (frame: Frame) => void): () => void

}

/** Options for {@link RemoteActor}. */
export interface RemoteOptions {
  readonly name?: string
}

/** Options for {@link serve}. */
export interface ServeOptions {

  /** Converts a handler error into wire data. Defaults to name/message/code. */
  readonly serializeError?: (error: unknown) => SerializedError

}

export function serializeError(error: unknown): SerializedError {
  if (error instanceof Error) {
    const code = (error as { code?: unknown }).code
    return code === undefined ?
      { name: error.name, message: error.message } :
      { name: error.name, message: error.message, code }
  }
  return { name: 'Error', message: String(error) }
}

export function isFrame(value: unknown): value is Frame {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const frame = value as { type?: unknown, id?: unknown, error?: unknown }
  switch (frame.type) {
    case 'send':
      return true
    case 'ask':
    case 'reply':
      return typeof frame.id === 'number'
    case 'error':
      return typeof frame.id === 'number' && typeof frame.error === 'object' && frame.error !== null
    default:
      return false
  }
}
