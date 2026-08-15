export interface Waiter {
  resolve(): void,
  reject(err: unknown): void
}

interface Failure {
  error: unknown
}

function assertDelta(value: number, name: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer.`)
  }
}

export default class WaitGroup {
  #counter: number
  #waiters: Waiter[] = []
  #failure?: Failure

  /** Creates a reusable wait group with an optional non-negative counter. */
  constructor(counter = 0) {
    assertDelta(counter, 'counter')
    this.#counter = counter
  }

  /** Settles all waiters in arrival order (first to wait is first to be released). */
  #settle(f: (waiter: Waiter) => void) {
    const waiters = this.#waiters
    this.#waiters = []
    for (const waiter of waiters) {
      f(waiter)
    }
  }

  #throwIfFailed() {
    if (this.#failure) {
      throw this.#failure.error
    }
  }

  #fail(error: unknown) {
    if (this.#failure) {
      return this.#failure.error
    }
    this.#failure = { error }
    this.#settle(waiter => { waiter.reject(error) })
    return error
  }

  #resolveIfZero() {
    if (this.#counter === 0) {
      this.#settle(waiter => { waiter.resolve() })
    }
  }

  /**
   * Adds a non-negative safe-integer delta.
   *
   * A group can be reused by adding work after it reaches zero. A failed group
   * is terminal and rethrows its original failure from every mutation.
   */
  add(delta = 1) {
    this.#throwIfFailed()
    assertDelta(delta, 'delta')

    const counter = this.#counter + delta
    if (!Number.isSafeInteger(counter)) {
      const error = new RangeError('WaitGroup counter overflow.')
      this.#fail(error)
      throw error
    }

    this.#counter = counter
    this.#resolveIfZero()
  }

  /**
   * Completes a non-negative safe-integer amount of work.
   *
   * Underflow is rejected atomically: the previous counter is retained, all
   * existing waiters reject, and the group enters a terminal failed state.
   */
  done(delta = 1) {
    this.#throwIfFailed()
    assertDelta(delta, 'delta')

    if (delta > this.#counter) {
      const error = new RangeError('WaitGroup counter underflow.')
      this.#fail(error)
      throw error
    }

    this.#counter -= delta
    this.#resolveIfZero()
  }

  /**
   * Waits for the counter to reach zero.
   *
   * Repeated waits at zero resolve immediately. Existing and future waits reject
   * with the original error after underflow, overflow, or explicit rejection.
   */
  async wait() {
    this.#throwIfFailed()
    if (this.#counter === 0) {
      return
    }
    await new Promise<void>((resolve, reject) => {
      this.#waiters.push({ resolve, reject })
    })
  }

  /**
   * Transitions the group into a terminal failed state and rejects all waiters.
   * Repeated rejection preserves the first error.
   */
  reject(err: unknown) {
    this.#fail(err)
  }
}
