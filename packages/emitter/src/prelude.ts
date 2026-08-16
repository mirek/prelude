/** Function that handles emitted events. */
export type Listener<T extends unknown[] = unknown[]> =
  (...args: T) =>
    void

/** Supported event name types. */
export type Name =
  | number
  | symbol
  | string

/** Named listener record for meta events. */
export type NamedListener<T extends unknown[] = unknown[]> =
  [ name: Name, listener: Listener<T> ]

/**
 * Event mapping type.
 * Maps event names to their payload types.
 * Includes built-in meta events (newListener, removeListener, error).
 */
export type Events =
  Record<Name, unknown[]> & {
    newListener: NamedListener,
    removeListener: NamedListener,
    error: unknown[]
  }

/** Function that evaluates event payloads for conditional listeners. */
export type Predicate<T extends unknown[] = unknown[]> =
  (...args: T) =>
    boolean

/** Options of {@link Interface.eventually} and {@link Interface.eventuallyIf}. */
export type WaitOptions = {
  /** Maximum time to wait in milliseconds before rejecting with a `timeout` error (default: 60 seconds; a non-finite value waits forever). */
  timeout?: number,
  /** Aborting removes the listener and the timer and rejects with `signal.reason`. */
  signal?: AbortSignal
}
