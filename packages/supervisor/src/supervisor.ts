import { Actor } from '@prelude/actor'
import type * as A from '@prelude/actor'
import SupervisorError from './error.js'
import type { Options, Strategy } from './prelude.js'

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

interface Final {
  readonly status: 'stopped' | 'failed'
  readonly reason: unknown
}

function terminal(child: A.Supervised) {
  return child.status === 'stopped' || child.status === 'failed'
}

/** A child that is stopping, stopped or failed is on its way out and cannot be restarted. */
function terminating(child: A.Supervised) {
  return child.status !== 'running'
}

/**
 * Supervises a group of children (actors or nested supervisors), deciding what
 * happens when one of them fails.
 *
 * Children stay in place across restarts — their mailboxes and the references
 * others hold remain valid — because {@link Actor.restart} re-initialises state
 * without replacing the actor.
 *
 * Restart intensity is bounded: more than `maxRestarts` restarts within
 * `window` milliseconds makes the supervisor give up. It then escalates to its
 * own supervisor if it has one; otherwise it kills the remaining children and
 * fails with a {@link SupervisorError}.
 */
export class Supervisor implements A.Supervisor, A.Supervised {

  readonly name?: string

  /** Parent consulted when this supervisor gives up. May be assigned after construction. */
  supervisor?: A.Supervisor

  readonly #strategy: Strategy
  readonly #maxRestarts: number
  readonly #window: number
  readonly #now: () => number
  readonly #onFailure?: Options['onFailure']
  readonly #done = deferred<void>()

  #children: A.Supervised[] = []
  #status: A.Status = 'running'
  #final?: Final
  #restartTimes: number[] = []
  #restarts = 0
  #queue: Promise<unknown> = Promise.resolve()
  /** Set while the queued decision awaits the parent's directive. */
  #escalating = false

  constructor(options: Options = {}) {
    const maxRestarts = options.maxRestarts ?? 3
    const window = options.window ?? 5000
    if (!(Number.isSafeInteger(maxRestarts) && maxRestarts >= 0)) {
      throw new SupervisorError('maxRestarts must be a non-negative integer.', 'invalid')
    }
    if (!(Number.isFinite(window) && window >= 0)) {
      throw new SupervisorError('window must be a non-negative number of milliseconds.', 'invalid')
    }
    this.name = options.name
    this.supervisor = options.supervisor
    this.#strategy = options.strategy ?? 'one-for-one'
    this.#maxRestarts = maxRestarts
    this.#window = window
    this.#now = options.now ?? (() => Date.now())
    this.#onFailure = options.onFailure
    this.#done.promise.catch(() => {})
  }

  get status(): A.Status {
    return this.#status
  }

  /** The error that made the supervisor give up, if any. */
  get error(): unknown {
    return this.#final?.status === 'failed' ? this.#final.reason : undefined
  }

  /** Total number of child restarts performed. */
  get restarts(): number {
    return this.#restarts
  }

  /** Live children in start order. Terminated children are removed automatically. */
  get children(): readonly A.Supervised[] {
    return this.#children
  }

  /** Settles when the supervisor terminates: resolves on stop/kill, rejects when it gave up. */
  get done(): Promise<void> {
    return this.#done.promise
  }

  /** Creates an actor supervised by this supervisor. */
  spawn<M, S = undefined, R = void>(options: A.Options<M, S, R>): Actor<M, S, R> {
    this.#assertRunning()
    return this.supervise(new Actor<M, S, R>({ ...options, supervisor: this }))
  }

  /** Adopts an existing child, becoming its supervisor. */
  supervise<C extends A.Supervised>(child: C): C {
    this.#assertRunning()
    if (terminal(child)) {
      throw new SupervisorError('Cannot supervise a terminated child.', 'invalid')
    }
    // Transfer: the previous supervisor must not keep operating on (stopping, restarting) the child.
    const previous = child.supervisor
    if (previous instanceof Supervisor && previous !== this) {
      previous.#forget(child)
    }
    child.supervisor = this
    if (this.#children.includes(child)) {
      // Already listed: adopting twice would restart (and count) the child twice per decision.
      // The supervisor is still reassigned, in case another supervisor took the child over.
      return child
    }
    this.#children.push(child)
    const forget = () => this.#forget(child)
    child.done.then(forget, forget)
    return child
  }

  #forget(child: A.Supervised): void {
    this.#children = this.#children.filter(other => other !== child)
  }

  /**
   * The {@link A.Supervisor} protocol: called by a child whose handler threw and
   * whose local policy escalated. Decisions are serialised so concurrent
   * failures cannot interleave restarts.
   */
  failure(child: A.Supervised, error: unknown, message: unknown): Promise<A.Directive> {
    const decision = this.#queue.then(() => this.#decide(child, error, message))
    this.#queue = decision.catch(() => {})
    return decision
  }

  /** Restarts every child in start order and resets the restart window. */
  restart(): Promise<void> {
    if (this.#final) {
      return Promise.reject(this.#final.reason)
    }
    const perform = async () => {
      this.#restartTimes = []
      await this.#restartChildren(this.#children)
    }
    if (this.#escalating) {
      // The queued decision is waiting for our parent, and the parent may be the one
      // restarting us (e.g. all-for-one for a sibling of ours) before it can answer:
      // queueing behind that decision would deadlock both supervisors.
      return perform()
    }
    const run = this.#queue.then(perform)
    this.#queue = run.catch(() => {})
    return run
  }

  /**
   * Stops children one at a time in reverse start order, then terminates.
   * A child whose `stop()` rejects does not prevent the others from stopping nor the
   * supervisor from terminating.
   */
  stop(): Promise<void> {
    if (this.#status === 'running') {
      this.#status = 'stopping'
      void this.#queue.then(async () => {
        for (const child of [ ...this.#children ].reverse()) {
          await child.stop().catch(() => {})
        }
        this.#finish({ status: 'stopped', reason: new SupervisorError('Supervisor stopped.', 'stopped') })
      })
    }
    return this.#terminated()
  }

  /** Kills every child immediately, then terminates (even if a child's `kill()` rejects). */
  kill(reason: unknown = new SupervisorError('Supervisor killed.', 'killed')): Promise<void> {
    if (!this.#final) {
      this.#status = 'stopping'
      void Promise
        .allSettled(this.#children.map(child => child.kill(reason)))
        .then(() => this.#finish({ status: 'stopped', reason }))
    }
    return this.#terminated()
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.stop()
  }

  #assertRunning(): void {
    if (this.#status !== 'running') {
      throw new SupervisorError('Supervisor is not running.', 'stopped')
    }
  }

  #terminated(): Promise<void> {
    return this.#done.promise.then(() => {}, () => {})
  }

  #finish(final: Final): void {
    if (this.#final) {
      return
    }
    this.#final = final
    this.#status = final.status
    if (final.status === 'failed') {
      this.#done.reject(final.reason)
    } else {
      this.#done.resolve()
    }
  }

  #exceeded(): boolean {
    const now = this.#now()
    this.#restartTimes = this.#restartTimes.filter(time => now - time <= this.#window)
    this.#restartTimes.push(now)
    return this.#restartTimes.length > this.#maxRestarts
  }

  async #decide(child: A.Supervised, error: unknown, message: unknown): Promise<A.Directive> {
    if (this.#final) {
      return 'stop'
    }
    if (!this.#children.includes(child)) {
      // A child that names us as its supervisor (e.g. `new Actor({ supervisor })`) without having
      // been passed to `supervise()`: adopt it now rather than silently stopping it. A child that
      // names someone else (handed over while this decision was queued, or reported by a stranger)
      // is not ours to restart, let alone to take back from its supervisor.
      if (this.#status !== 'running' || child.supervisor !== this || terminal(child)) {
        return 'stop'
      }
      this.supervise(child)
    }
    this.#onFailure?.(child, error, message)

    if (this.#exceeded()) {
      return this.#giveUp(child, error, message)
    }

    const index = this.#children.indexOf(child)
    const others =
      this.#strategy === 'one-for-one' ? [] :
        this.#strategy === 'all-for-one' ? this.#children.filter(other => other !== child) :
          this.#children.slice(index + 1)
    try {
      await this.#restartChildren(others)
    } catch (restartError) {
      return this.#giveUp(child, restartError, message)
    }
    this.#restarts += 1
    return 'restart'
  }

  /**
   * Restarts children in order; a child that fails to restart aborts the whole operation.
   * Children that are already terminating (e.g. mid-`kill()`) are skipped: they will be
   * forgotten once done and restarting them is neither possible nor wanted.
   */
  async #restartChildren(children: readonly A.Supervised[]): Promise<void> {
    for (const child of children) {
      if (terminating(child)) {
        continue
      }
      await child.restart()
      this.#restarts += 1
    }
  }

  /**
   * Restart intensity exceeded (or a sibling could not be restarted). Escalate
   * to the parent if there is one; otherwise kill the remaining children and fail.
   */
  async #giveUp(child: A.Supervised, error: unknown, message: unknown): Promise<A.Directive> {
    const reason = new SupervisorError(
      `Restart limit exceeded: more than ${this.#maxRestarts} restart(s) within ${this.#window}ms.`,
      'restarts',
      { cause: error }
    )
    if (this.supervisor) {
      let directive: A.Directive
      this.#escalating = true
      try {
        directive = await this.supervisor.failure(this, reason, message)
      } catch (parentError) {
        return this.#fail(child, parentError)
      } finally {
        this.#escalating = false
      }
      if (this.#final) {
        return 'stop'
      }
      if (directive === 'resume') {
        // The parent forgives the intensity; keep going with the failing child restarted.
        this.#restartTimes = []
        this.#restarts += 1
        return 'restart'
      }
      if (directive === 'restart') {
        this.#restartTimes = []
        try {
          await this.#restartChildren(this.#children.filter(other => other !== child))
        } catch (restartError) {
          return this.#fail(child, restartError)
        }
        this.#restarts += 1
        return 'restart'
      }
    }
    return this.#fail(child, reason)
  }

  #fail(child: A.Supervised, reason: unknown): A.Directive {
    if (!this.#final) {
      this.#status = 'stopping'
      const others = this.#children.filter(other => other !== child)
      void Promise
        .allSettled(others.map(other => other.kill(reason)))
        .then(() => this.#finish({ status: 'failed', reason }))
    }
    return 'stop'
  }

}

export default Supervisor
