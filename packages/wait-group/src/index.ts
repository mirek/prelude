export interface Waiter {
  resolve(): void,
  reject(err: unknown): void
}

export default class WaitGroup {
  #counter = 0
  #waiters: Waiter[] = []

  /** Creates new wait group with optional initial counter. */
  constructor(counter = 0) {
    this.add(counter)
  }

  /** Pops all waiters applying provided settle function. */
  #settle(f: (waiter: Waiter) => void) {
    let waiter = this.#waiters.pop()
    while (waiter) {
      f(waiter)
      waiter = this.#waiters.pop()
    }
  }

  /**
   * Resolves waiters if counter is zero.
   * @throws if counter is negative.
   */
  #maybeResolve() {
    if (this.#counter === 0) {
      this.#settle(({ resolve }) => resolve())
    }
    if (this.#counter < 0) {
      throw new Error('negative counter')
    }
  }

  /** Adds positive or negative delta to the counter maybe settling waiters. */
  add(delta = 1) {
    this.#counter += delta
    this.#maybeResolve()
  }

  /** Subtracts delta from the counter maybe settling waiters. */
  done(delta = 1) {
    this.#counter -= delta
    this.#maybeResolve()
  }

  /**
   * Waits for wait group to settle.
   * Resolves if counter hits zero.
   * Rejects if counter becomes negative.
   * Rejects if rejection was explicitly invoked.
   */
  async wait() {
    if (this.#counter === 0) {
      return
    }
    await new Promise<void>((resolve, reject) => {
      this.#waiters.push({ resolve, reject })
    })
  }

  /** Rejects all waiters. */
  reject(err: unknown) {
    this.#settle(({ reject }) => reject(err))
  }
}
