/**
 * Lifecycle status.
 *
 * - `running` — accepting and processing messages.
 * - `stopping` — no longer accepting messages; draining (after {@link Actor.stop}) or
 *   waiting for the in-flight handler to settle (after {@link Actor.kill} or a failure).
 * - `stopped` — terminated normally, by {@link Actor.stop} or {@link Actor.kill}.
 * - `failed` — terminated because a handler error was resolved with `'stop'`.
 */
export type Status =
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'failed'

/**
 * What to do after a handler throws.
 *
 * - `resume` — drop the failing message and keep the current state.
 * - `restart` — drop the failing message and re-initialise the state via `init`; the mailbox is kept.
 * - `stop` — terminate the actor with status `failed`.
 * - `escalate` — defer to the {@link Supervisor}; without one this means `stop`.
 */
export type Directive =
  | 'resume'
  | 'restart'
  | 'stop'
  | 'escalate'

/**
 * The actor as seen from inside its own handler and hooks. Deliberately has no
 * `ask`: awaiting a reply from yourself while you are the one processing
 * messages would never resolve.
 */
export interface Self<M, S> {
  readonly name?: string
  readonly status: Status
  readonly state: S
  readonly restarts: number
  readonly pending: number
  send(message: M): Promise<void>
  stop(): Promise<void>
  kill(reason?: unknown): Promise<void>
  restart(): Promise<void>
}

/** Per-message context passed to the handler. */
export interface Context<M, S> {

  /** The actor processing the message. */
  readonly self: Self<M, S>

  /**
   * Aborted when the actor is killed, fails, or is restarted while this message
   * is in flight. Never aborted by a graceful stop.
   */
  readonly signal: AbortSignal

}

/** Message handler; the returned value is the reply for {@link Ref.ask}. */
export type Receive<M, S, R = void> =
  (message: M, state: S, context: Context<M, S>) =>
    R | Promise<R>

/** The minimal surface a supervisor needs from a supervised child. */
export interface Supervised {
  readonly name?: string
  readonly status: Status
  readonly done: Promise<void>
  supervisor?: Supervisor
  restart(): Promise<void>
  stop(): Promise<void>
  kill(reason?: unknown): Promise<void>
}

/** Decides what a supervised child does after its handler throws. */
export interface Supervisor {
  failure(child: Supervised, error: unknown, message: unknown): Directive | Promise<Directive>
}

/** Options for {@link Ref.ask}. */
export interface AskOptions {

  /** Reject with an `ActorError` (`code: 'timeout'`) if no reply arrives within this many milliseconds. */
  readonly timeout?: number

  /** Reject with `signal.reason` when aborted. */
  readonly signal?: AbortSignal

}

/** Send-only handle to an actor: what callers that should not manage the lifecycle receive. */
export interface Ref<M, R = void> {
  readonly name?: string
  send(message: M): Promise<void>
  ask(message: M, options?: AskOptions): Promise<R>
}

export interface Options<M, S, R> {

  /** Optional name, useful in logs and supervisors. */
  readonly name?: string

  /** Creates the initial state. Called on construction and on every restart. */
  readonly init?: () => S

  /** Message handler. */
  readonly receive: Receive<M, S, R>

  /**
   * Mailbox capacity. `send`/`ask` wait for room when the mailbox is full;
   * `0` hands messages over directly to the handler. Defaults to `Infinity`.
   */
  readonly cap?: number

  /**
   * Local failure policy. Defaults to `'escalate'`.
   * If the hook itself throws, the actor fails with that error.
   */
  readonly onError?: (error: unknown, message: M, self: Self<M, S>) => Directive | Promise<Directive>

  /**
   * Called for every message that was accepted (or attempted) but will never be
   * processed: dropped on kill/failure, or rejected because the actor was not running.
   */
  readonly onDeadLetter?: (message: M, reason: unknown, self: Self<M, S>) => void

  /** Supervisor consulted when the local policy escalates. */
  readonly supervisor?: Supervisor

}
