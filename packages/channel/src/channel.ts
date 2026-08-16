export type Thunk<R = void> =
  () =>
    R

export type Undo =
  Thunk<void>

export type Done =
  (err?: unknown) =>
    void

export type Read<T> =
  (result: IteratorResult<T>) =>
    void

export type Write<T> = {
  value: T
  enqueued?: Done
  written?: Done
}

export class AttemptBase {
}

export class ReadAttempt<T, R> extends AttemptBase {
  constructor(
    public readonly channel: Channel<T>,
    public readonly perform: (result: IteratorResult<T>) => IteratorResult<R>
  ) {
    super()
  }
}

export class WriteAttempt<T, R> extends AttemptBase {
  constructor(
    public readonly channel: Channel<T>,
    public readonly value: T,
    public readonly perform: (value: T) => IteratorResult<R>
  ) {
    super()
  }
}

export type Attempt =
  | Channel<any>
  | ReadAttempt<any, any>
  | WriteAttempt<any, any>

export type Attempted<A extends Attempt> =
  A extends Channel<infer T> ?
    T :
    A extends ReadAttempt<any, infer R> ?
      R :
      A extends WriteAttempt<any, infer R> ?
        R :
        never

export class Channel<T> implements AsyncIterableIterator<T> {

  #cap: number
  #doneWriting: boolean
  #reads: Read<T>[]
  #writes: Write<T>[]
  #doneWritingCallbacks: Done[]
  #failure: undefined | { error: unknown }

  constructor(cap = 0) {
    // A negative or non-integer capacity (NaN, 1.5) makes the buffer bookkeeping misbehave:
    // writes hang or throw deep inside consume(). Infinity means unbounded.
    if (cap !== Infinity && (!Number.isSafeInteger(cap) || cap < 0)) {
      throw new RangeError(`Expected capacity to be a non-negative integer or Infinity, got ${cap}.`)
    }
    this.#cap = cap
    this.#doneWriting = false
    this.#reads = []
    this.#writes = []
    this.#doneWritingCallbacks = []
    this.#failure = undefined
  }

  get cap() {
    return this.#cap
  }

  /** @returns number of pending reads. */
  get pendingReads() {
    return this.#reads.length
  }

  /** @returns number of pending writes. */
  get pendingWrites() {
    return this.#writes.length
  }

  [Symbol.asyncIterator]() {
    return this
  }

  async return(value?: any) {
    this.close()
    return { done: true, value }
  }

  async throw(err?: any) {
    this.close(err)
    return { done: true, value: err }
  }

  /** @returns `true` if channels has been closed and there are no pending writes. */
  get done() {
    return this.#doneWriting && this.#writes.length === 0
  }

  /** @returns `true` if channel has been closed for writing. */
  get doneWriting() {
    return this.#doneWriting
  }

  /** @returns `true` if channel has been failed through {@link fail}. */
  get failed() {
    return this.#failure !== undefined
  }

  /** @returns error passed to {@link fail}, `undefined` if channel has not failed. */
  get error() {
    return this.#failure?.error
  }

  /**
   * Closes writing only.
   *
   * Writes beyond capacity are settled with optional err.
   *
   * If there are no pending writes channel is effectively done - closed for reading and writing.
   *
   * @see {@link close} for closing channel for reading and writing.
   */
  closeWriting(err?: unknown) {
    if (this.#doneWriting) {
      throw new Error('Channel already closed for writing.')
    }
    this.#doneWriting = true
    while (true) {
      const cb = this.#doneWritingCallbacks.pop()
      if (!cb) {
        break
      }
      cb.call(this, err)
    }
    while (this.#writes.length > this.#cap) {
      const write = this.#writes.pop() as Write<T>
      write.enqueued?.call(this, err)
      write.written?.call(this, err)
    }
    if (this.#writes.length === 0) {
      while (this.#reads.length > 0) {
        const read = this.#reads.pop() as Read<T>
        read({ done: true, value: undefined })
      }
    }
  }

  /**
   * Closes channel for both reading and writing.
   *
   * Idempotent: a channel that is already closed for writing (for example a producer that
   * finished before the consumer stopped iterating) is drained without throwing.
   *
   * @see {@link closeWriting} for closing channel for writing only.
   */
  close(err?: unknown) {
    if (!this.#doneWriting) {
      this.closeWriting(err)
    }
    while (true) {
      const write = this.#writes.pop()
      if (!write) {
        break
      }
      write.enqueued?.call(this, err)
      write.written?.call(this, err)
    }
    while (true) {
      const read = this.#reads.pop()
      if (!read) {
        break
      }
      read?.call(this, { done: true, value: undefined })
    }
  }

  /**
   * Fails the channel: closes it for reading and writing, rejects pending writes with `err`
   * (even when `err` is falsy) and rejects pending and subsequent reads with `err`.
   *
   * Unlike {@link close}, which completes readers normally, this propagates a producer error
   * to consumers (`next()`, `read()`, `maybeRead()` and `for await` reject with `err`).
   *
   * No-op if the channel is already closed for writing.
   */
  fail(err: unknown) {
    if (this.#doneWriting) {
      return
    }
    this.#failure = { error: err }
    this.close(err)
  }

  /**
   * Registers callback to be called when channel has done writing.
   * Callback is called immediatelly if channel is already closed for writing.
   * @returns undo function that unregisters callback.
   */
  onceDoneWriting(done: Done): Undo {
    if (this.#doneWriting) {
      done()
      return () => {}
    }
    this.#doneWritingCallbacks.push(done)
    return () => {
      const i = this.#doneWritingCallbacks.indexOf(done)
      if (i === -1) {
        return
      }
      this.#doneWritingCallbacks.splice(i, 1)
    }
  }

  next(): Promise<IteratorResult<T>> {
    return new Promise((resolve, reject) => {
      if (this.#failure) {
        reject(this.#failure.error)
        return
      }
      if (this.done) {
        resolve({ done: true, value: undefined })
        return
      }
      this.#reads.push(result => {
        if (result.done && this.#failure) {
          reject(this.#failure.error)
        } else {
          resolve(result)
        }
      })
      if (this.#writes.length > 0) {
        this.#consume()
      }
    })
  }

  /** @throws if channel is closed. */
  async read(): Promise<T> {
    const result = await this.next()
    if (result.done) {
      throw new Error('Channel closed.')
    }
    return result.value
  }

  /**
   * Reads the next value, returning `undefined` after channel completion.
   *
   * When `T` includes `undefined`, a queued `undefined` value and channel
   * completion have the same return value. Use `next()` and inspect `done` when
   * that distinction matters.
   */
  async maybeRead(): Promise<undefined | T> {
    const result = await this.next()
    return result.done ?
      undefined :
      result.value
  }

  /** @returns all values that was possible to read immediatelly, aka all pending writes. */
  consumeWrites(): T[] {
    const values: T[] = []
    while (this.#writes.length > 0) {
      values.push(this.consumeWrite())
    }
    return values
  }

  readAttempt<R>(perform: (result: IteratorResult<T>) => IteratorResult<R>) {
    return new ReadAttempt(this, perform)
  }

  write(value: T) {
    return new Promise<void>((resolve, reject) => {
      if (this.#doneWriting) {
        reject(new Error('Channel closed.'))
        return
      }
      if (this.#cap === 0 && this.#reads.length > 0) {
        this.consumeRead({ done: false, value })
        resolve(undefined)
        return
      } else if (this.#writes.length < this.#cap) {
        this.#writes.push({ value })
        resolve(undefined)
        if (this.#reads.length > 0) {
          this.#consume()
        }
        return
      }
      this.#writes.push({
        value,
        // A failed channel rejects its blocked writer whatever the reason is, even a falsy one;
        // a clean close (`closeWriting()` / `close()` without a reason) resolves it.
        enqueued: (err: unknown) => {
          if (this.#failure) {
            // Prefer the recorded reason: a `onceDoneWriting` callback draining the channel between
            // `fail()` recording it and `closeWriting()` settling the writes calls this without one.
            reject(this.#failure.error)
          } else if (err) {
            reject(err)
          } else {
            resolve(undefined)
          }
        }
      })
    })
  }

  async maybeWrite(value: T) {
    return this
      .write(value)
      .then(() => true)
      .catch(() => false)
  }

  writeIgnore(value: T) {
    this.write(value).catch(() => {})
  }

  writeAttempt<R>(value: T, perform: (value: T) => IteratorResult<R>) {
    return new WriteAttempt(this, value, perform)
  }

  /**
   * Pushes read to the channel.
   * @returns undo operation.
   */
  pushRead(read: Read<T>): Undo {
    if (this.#writes.length > 0) {
      throw new Error('Expected no writes to push read.')
    }
    this.#reads.push(read)
    return () => {
      this.#removeRead(read)
    }
  }

  /**
   * Pushes write to the channel.
   * @returns undo operation.
   */
  pushWrite(write: Write<T>): Undo {
    if (this.#reads.length > 0) {
      throw new Error('Expected no reads to push write.')
    }
    this.#writes.push(write)
    return () => {
      this.#removeWrite(write)
    }
  }

  /**
   * Removes read from channel.
   * No-op if not found.
   * @internal
   */
  #removeRead(read: Read<T>) {
    const i = this.#reads.indexOf(read)
    if (i === -1) {
      return
    }
    this.#reads.splice(i, 1)
  }

  /**
   * Removes write from channel without settling it: undoing a pushed write is a
   * cancellation (the value was never delivered), not a delivery or a failure.
   * No-op if write is not found.
   * @internal
   */
  #removeWrite(write: Write<T>) {
    const i = this.#writes.lastIndexOf(write)
    if (i === -1) {
      return
    }
    this.#writes.splice(i, 1)
  }

  consumeRead(result: IteratorResult<T>) {
    const read = this.#reads.shift()
    if (!read) {
      throw new Error('Expected read to consume.')
    }
    read(result)
  }

  consumeWrite() {
    const write = this.#writes.shift()
    if (!write) {
      throw new Error('Expected write to consume.')
    }
    if (this.#cap === 0) {
      write.enqueued?.call(this)
    } else if (this.#writes.length >= this.#cap) {
      this.#writes[this.#cap - 1].enqueued?.call(this)
    }
    write.written?.call(this)
    return write.value
  }

  #consume() {
    if (this.#reads.length === 0) {
      throw new Error('no reads')
    }
    if (this.#writes.length === 0) {
      throw new Error('no writes')
    }
    const read = this.#reads.shift() as Read<T>
    const write = this.#writes.shift() as Write<T>
    if (this.#cap === 0) {
      write.enqueued?.call(this)
      write.written?.call(this)
    } else if (this.#writes.length >= this.#cap) {
      this.#writes[this.#cap - 1].enqueued?.call(this)
    }
    read.call(this, { done: false, value: write.value })
  }

}
