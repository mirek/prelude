import * as Channel from '@prelude/channel'
import ActorError from './error.js'
import type {
  AskOptions,
  Context,
  Directive,
  Options,
  Receive,
  Ref,
  Self,
  Status,
  Supervised,
  Supervisor
} from './prelude.js'

interface Envelope<M, R> {
  readonly message: M
  readonly resolve?: (value: R) => void
  readonly reject?: (reason: unknown) => void
}

interface Final {
  readonly status: 'stopped' | 'failed'
  readonly reason: unknown
}

interface Deferred<T> {
  readonly promise: Promise<T>
  readonly resolve: (value: T) => void
  readonly reject: (reason?: unknown) => void
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolve_, reject_) => {
    resolve = resolve_
    reject = reject_
  })
  return { promise, resolve, reject }
}

function assertCap(cap: number) {
  if (cap !== Infinity && !(Number.isSafeInteger(cap) && cap >= 0)) {
    throw new ActorError('Mailbox capacity must be a non-negative integer or Infinity.', 'invalid')
  }
}

/**
 * An actor owns a piece of state and processes messages from its mailbox one at
 * a time. It starts processing as soon as it is constructed.
 *
 * @typeparam M - Message type.
 * @typeparam S - State type.
 * @typeparam R - Reply type returned by the handler and resolved by {@link ask}.
 */
export class Actor<M, S = undefined, R = void> implements Ref<M, R>, Self<M, S>, Supervised {

  readonly name?: string

  /** Consulted when a failure is escalated. May be assigned after construction. */
  supervisor?: Supervisor

  readonly #init: () => S
  readonly #receive: Receive<M, S, R>
  readonly #onError?: Options<M, S, R>['onError']
  readonly #onDeadLetter?: Options<M, S, R>['onDeadLetter']
  readonly #inbox: Channel.Channel<Envelope<M, R>>
  readonly #done = deferred<void>()

  #state: S
  #status: Status = 'running'
  #final?: Final
  #controller = new AbortController()
  #context: Context<M, S>
  #handling = false
  #restarts = 0
  #restartWaiters: Deferred<void>[] = []

  constructor(options: Options<M, S, R>) {
    const cap = options.cap ?? Infinity
    assertCap(cap)
    this.name = options.name
    this.supervisor = options.supervisor
    this.#init = options.init ?? (() => undefined as S)
    this.#receive = options.receive
    this.#onError = options.onError
    this.#onDeadLetter = options.onDeadLetter
    this.#inbox = Channel.of<Envelope<M, R>>(cap)
    this.#context = { self: this, signal: this.#controller.signal }
    this.#state = this.#init()
    // `done` rejects on failure; observe it here so an unawaited actor never
    // surfaces as an unhandled rejection.
    this.#done.promise.catch(() => {})
    void this.#run()
  }

  /** Current state. Replaced on restart. */
  get state(): S {
    return this.#state
  }

  get status(): Status {
    return this.#status
  }

  /** The failure that terminated the actor, if any. */
  get error(): unknown {
    return this.#final?.status === 'failed' ? this.#final.reason : undefined
  }

  /** Number of messages waiting in the mailbox (including senders blocked on a full mailbox). */
  get pending(): number {
    return this.#inbox.pendingWrites
  }

  /** Number of restarts so far. */
  get restarts(): number {
    return this.#restarts
  }

  /**
   * Settles when the actor has terminated: resolves after a normal stop or kill,
   * rejects with the failure when the actor failed.
   */
  get done(): Promise<void> {
    return this.#done.promise
  }

  /**
   * Enqueues a message. Resolves once the message is in the mailbox (waiting for
   * room when the mailbox is bounded); rejects if the actor is not running or
   * terminates before accepting it.
   */
  send(message: M): Promise<void> {
    if (this.#status !== 'running') {
      return this.#deadLetter(message, this.#stopReason())
    }
    return this.#inbox
      .write({ message })
      .catch(reason => this.#deadLetter(message, reason))
  }

  /**
   * Enqueues a message and resolves with the handler's return value. Rejects
   * with the handler's error, on timeout, on abort, or if the actor terminates
   * before processing the message.
   */
  ask(message: M, options: AskOptions = {}): Promise<R> {
    const { promise, resolve, reject } = deferred<R>()
    if (this.#status !== 'running') {
      const reason = this.#stopReason()
      this.#onDeadLetter?.(message, reason, this)
      reject(reason)
      return promise
    }

    const cleanups: (() => void)[] = []
    let settled = false
    const settle =
      (f: () => void) => {
        if (settled) {
          return
        }
        settled = true
        for (const cleanup of cleanups) {
          cleanup()
        }
        f()
      }
    const envelope: Envelope<M, R> = {
      message,
      resolve: value => settle(() => resolve(value)),
      reject: reason => settle(() => reject(reason))
    }

    if (options.timeout !== undefined) {
      const timer = setTimeout(
        () => envelope.reject!(new ActorError(`Ask timed out after ${options.timeout}ms.`, 'timeout')),
        options.timeout
      )
      cleanups.push(() => clearTimeout(timer))
    }

    const signal = options.signal
    if (signal) {
      if (signal.aborted) {
        envelope.reject!(signal.reason)
        return promise
      }
      const onAbort = () => envelope.reject!(signal.reason)
      signal.addEventListener('abort', onAbort, { once: true })
      cleanups.push(() => signal.removeEventListener('abort', onAbort))
    }

    this.#inbox
      .write(envelope)
      .catch(reason => {
        this.#onDeadLetter?.(message, reason, this)
        envelope.reject!(reason)
      })
    return promise
  }

  /**
   * Stops accepting messages, processes what is already queued and terminates.
   * Resolves once the actor has terminated (for any reason); idempotent.
   */
  stop(): Promise<void> {
    if (this.#status === 'running') {
      this.#status = 'stopping'
      this.#inbox.closeWriting(new ActorError('Actor stopped.', 'stopped'))
    }
    return this.#terminated()
  }

  /**
   * Terminates immediately: aborts the in-flight handler's signal, drops queued
   * messages as dead letters and rejects their asks. Resolves once the in-flight
   * handler (if any) has settled; idempotent.
   */
  kill(reason: unknown = new ActorError('Actor killed.', 'killed')): Promise<void> {
    this.#terminate({ status: 'stopped', reason })
    return this.#terminated()
  }

  /**
   * Re-initialises the state via `init`, keeping the mailbox. If a message is in
   * flight its signal is aborted and the restart happens once the handler
   * settles; while the failure policy is running (no handler touching the
   * state) it is applied immediately, so supervisors restarting siblings never
   * wait on each other.
   * Rejects if the actor has terminated; if `init` throws the actor fails with
   * that error (policy-driven restarts, by contrast, retry through the policy).
   */
  restart(): Promise<void> {
    if (this.#final) {
      return Promise.reject(this.#stopReason())
    }
    const waiter = deferred<void>()
    this.#restartWaiters.push(waiter)
    if (this.#handling) {
      this.#controller.abort(new ActorError('Actor restarting.', 'restarted'))
    } else {
      this.#applyRestart()
    }
    return waiter.promise
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.stop()
  }

  #stopReason(): unknown {
    return this.#final?.reason ?? new ActorError('Actor stopped.', 'stopped')
  }

  #terminated(): Promise<void> {
    return this.#done.promise.then(() => {}, () => {})
  }

  #deadLetter(message: M, reason: unknown): Promise<never> {
    this.#onDeadLetter?.(message, reason, this)
    return Promise.reject(reason)
  }

  async #run(): Promise<void> {
    while (true) {
      const next = await this.#inbox.next()
      if (next.done) {
        break
      }
      if (this.#final) {
        // Terminated between the mailbox handing the message over and us
        // getting to run: it is a dead letter, not work.
        this.#onDeadLetter?.(next.value.message, this.#final.reason, this)
        next.value.reject?.(this.#final.reason)
        continue
      }
      await this.#process(next.value)
      if (this.#restartWaiters.length > 0 && !this.#final) {
        this.#applyRestart()
      }
    }
    const final = this.#final ?? { status: 'stopped', reason: new ActorError('Actor stopped.', 'stopped') }
    this.#final = final
    this.#status = final.status
    if (final.status === 'failed') {
      this.#done.reject(final.reason)
    } else {
      this.#done.resolve()
    }
  }

  async #process(envelope: Envelope<M, R>): Promise<void> {
    let result: R
    this.#handling = true
    try {
      result = await this.#receive(envelope.message, this.#state, this.#context)
    } catch (error) {
      this.#handling = false
      if (this.#final) {
        envelope.reject?.(this.#final.reason)
        return
      }
      envelope.reject?.(error)
      if (this.#restartWaiters.length === 0) {
        await this.#fail(error, envelope.message)
      }
      return
    }
    this.#handling = false
    if (this.#final) {
      envelope.reject?.(this.#final.reason)
    } else {
      envelope.resolve?.(result)
    }
  }

  /** Runs the failure policy for an error thrown by the handler (or by `init` during a policy restart). */
  async #fail(error: unknown, message: M): Promise<void> {
    const generation = this.#restarts
    let current = error
    while (!this.#final) {
      let directive: Directive
      try {
        directive = await this.#decide(current, message)
      } catch (hookError) {
        this.#terminate({ status: 'failed', reason: hookError })
        return
      }
      if (this.#final) {
        return
      }
      switch (directive) {
        case 'resume':
          return
        case 'restart':
          if (this.#restarts !== generation) {
            // Someone restarted us while the policy was deciding; that restart stands.
            return
          }
          try {
            this.#reinit()
            return
          } catch (initError) {
            current = initError
            continue
          }
        default:
          this.#terminate({ status: 'failed', reason: current })
          return
      }
    }
  }

  async #decide(error: unknown, message: M): Promise<Directive> {
    let directive: Directive = this.#onError ?
      await this.#onError(error, message, this) :
      'escalate'
    if (directive === 'escalate') {
      directive = this.supervisor ?
        await this.supervisor.failure(this, error, message) :
        'stop'
    }
    return directive === 'escalate' ? 'stop' : directive
  }

  /** Applies an explicit `restart()`; if `init` throws the actor fails. */
  #applyRestart(): void {
    try {
      this.#reinit()
    } catch (initError) {
      this.#terminate({ status: 'failed', reason: initError })
    }
  }

  #reinit(): void {
    const controller = new AbortController()
    const state = this.#init()
    this.#controller = controller
    this.#context = { self: this, signal: controller.signal }
    this.#state = state
    this.#restarts += 1
    const waiters = this.#restartWaiters
    this.#restartWaiters = []
    for (const waiter of waiters) {
      waiter.resolve()
    }
  }

  #terminate(final: Final): void {
    if (this.#final) {
      return
    }
    this.#final = final
    this.#status = 'stopping'
    const waiters = this.#restartWaiters
    this.#restartWaiters = []
    for (const waiter of waiters) {
      waiter.reject(final.reason)
    }
    this.#controller.abort(final.reason)
    if (!this.#inbox.doneWriting) {
      // Rejects senders blocked on a full mailbox and refuses further writes.
      this.#inbox.closeWriting(final.reason)
    }
    for (const envelope of this.#inbox.consumeWrites()) {
      this.#onDeadLetter?.(envelope.message, final.reason, this)
      envelope.reject?.(final.reason)
    }
    // Wake the run loop if it is waiting for a message.
    while (this.#inbox.pendingReads > 0) {
      this.#inbox.consumeRead({ done: true, value: undefined })
    }
  }

}

export default Actor
