import * as Ch from './index.js'
import * as Testing from '@prelude/testing'
import { test } from 'node:test'
import assert from 'node:assert/strict'

// Model-based check of a single channel: every operation is applied to a
// Channel and to a reference model (a queue of writes of which the first
// `cap` are accepted, a queue of waiting readers, and the close/fail state).
// After each operation the microtask queue is drained and the observable
// state — pending counts, flags and the settlement of every promise handed
// out so far — must match. Every trace ends by settling everything, so no
// promise is left dangling.

type Op =
  | { type: 'write', value: number }
  | { type: 'read' }
  | { type: 'closeWriting', err?: string }
  | { type: 'close', err?: string }
  | { type: 'fail', err: string | 0 }

type Settled<T> =
  | { state: 'pending' }
  | { state: 'resolved', value: T }
  | { state: 'rejected', reason: unknown }

type ModelWrite = { value: number, settled: Settled<void> }
type ModelRead = { settled: Settled<IteratorResult<number>> }

/** Tracks the settlement of a promise without leaving an unhandled rejection. */
const track =
  <T>(promise: Promise<T>): { readonly settled: Settled<T> } => {
    const box: { settled: Settled<T> } = { settled: { state: 'pending' } }
    promise.then(
      value => { box.settled = { state: 'resolved', value } },
      (reason: unknown) => { box.settled = { state: 'rejected', reason } }
    )
    return box
  }

const flush =
  async () => {
    for (let i = 0; i < 4; i++) {
      await Promise.resolve()
    }
  }

const closedError = { state: 'rejected', reason: new Error('Channel closed.') }

const equalSettled =
  (actual: Settled<unknown>, expected: Settled<unknown>, what: string) => {
    if (actual.state === 'rejected' && expected.state === 'rejected' && actual.reason instanceof Error && expected.reason instanceof Error) {
      assert.equal(actual.reason.message, expected.reason.message, what)
      return
    }
    assert.deepEqual(actual, expected, what)
  }

class Model {
  writes: ModelWrite[] = []
  reads: ModelRead[] = []
  doneWriting = false
  failure: undefined | { error: unknown } = undefined

  constructor(readonly cap: number) {}

  get done() {
    return this.doneWriting && this.writes.length === 0
  }

  #settleWrite(write: ModelWrite, err: unknown) {
    if (write.settled.state !== 'pending') {
      return
    }
    if (this.failure) {
      write.settled = { state: 'rejected', reason: this.failure.error }
    } else if (err) {
      write.settled = { state: 'rejected', reason: err }
    } else {
      write.settled = { state: 'resolved', value: undefined }
    }
  }

  #settleRead(read: ModelRead, result: IteratorResult<number>) {
    if (result.done && this.failure) {
      read.settled = { state: 'rejected', reason: this.failure.error }
    } else {
      read.settled = { state: 'resolved', value: result }
    }
  }

  /** A read takes the oldest write; the write that thereby moves into the buffer is accepted. */
  #consume() {
    const read = this.reads.shift()!
    const write = this.writes.shift()!
    if (this.cap === 0) {
      this.#settleWrite(write, undefined)
    } else if (this.writes.length >= this.cap) {
      this.#settleWrite(this.writes[this.cap - 1], undefined)
    }
    this.#settleRead(read, { done: false, value: write.value })
  }

  write(value: number): ModelWrite {
    const write: ModelWrite = { value, settled: { state: 'pending' } }
    if (this.doneWriting) {
      write.settled = closedError as Settled<void>
    } else if (this.cap === 0 && this.reads.length > 0) {
      // Unbuffered with a waiting reader: hand the value over directly.
      this.writes.push(write)
      this.#consume()
    } else if (this.writes.length < this.cap) {
      // Room in the buffer: accepted at once, and delivered at once if a reader waits
      // (a waiting reader implies an empty buffer).
      this.writes.push(write)
      write.settled = { state: 'resolved', value: undefined }
      if (this.reads.length > 0) {
        this.#consume()
      }
    } else {
      this.writes.push(write)
    }
    return write
  }

  read(): ModelRead {
    const read: ModelRead = { settled: { state: 'pending' } }
    if (this.failure) {
      read.settled = { state: 'rejected', reason: this.failure.error }
    } else if (this.done) {
      read.settled = { state: 'resolved', value: { done: true, value: undefined } }
    } else {
      this.reads.push(read)
      if (this.writes.length > 0) {
        this.#consume()
      }
    }
    return read
  }

  closeWriting(err: unknown) {
    if (this.doneWriting) {
      throw new Error('Channel already closed for writing.')
    }
    this.doneWriting = true
    while (this.writes.length > this.cap) {
      this.#settleWrite(this.writes.pop()!, err)
    }
    if (this.writes.length === 0) {
      this.#drainReads()
    }
  }

  close(err: unknown) {
    if (!this.doneWriting) {
      this.closeWriting(err)
    }
    // Buffered values are dropped; their writes were already accepted.
    this.writes = []
    this.#drainReads()
  }

  fail(err: unknown) {
    if (this.doneWriting) {
      return
    }
    this.failure = { error: err }
    this.close(err)
  }

  #drainReads() {
    while (this.reads.length > 0) {
      this.#settleRead(this.reads.pop()!, { done: true, value: undefined })
    }
  }
}

const op =
  (rng: Testing.Prng, ops: readonly Op[]): Op => {
    const roll = rng.float()
    if (roll < 0.42) return { type: 'write', value: ops.length }
    if (roll < 0.84) return { type: 'read' }
    if (roll < 0.9) return { type: 'closeWriting', ...(rng.bool() ? { err: 'CW' } : {}) }
    if (roll < 0.95) return { type: 'close', ...(rng.bool() ? { err: 'C' } : {}) }
    return { type: 'fail', err: rng.bool() ? 'F' : 0 }
  }

const runWith =
  (cap: number) =>
    async (ops: readonly Op[]) => {
      const channel = Ch.of<number>(cap)
      const model = new Model(cap)
      const writes: Array<{ actual: { readonly settled: Settled<void> }, expected: ModelWrite }> = []
      const reads: Array<{ actual: { readonly settled: Settled<IteratorResult<number>> }, expected: ModelRead }> = []
      const compare = (what: string) => {
        assert.equal(channel.pendingReads, model.reads.length, `${what}: pendingReads`)
        assert.equal(channel.pendingWrites, model.writes.length, `${what}: pendingWrites`)
        assert.equal(channel.doneWriting, model.doneWriting, `${what}: doneWriting`)
        assert.equal(channel.done, model.done, `${what}: done`)
        assert.equal(channel.failed, model.failure !== undefined, `${what}: failed`)
        assert.equal(channel.error, model.failure?.error, `${what}: error`)
        writes.forEach(({ actual, expected }, i) => equalSettled(actual.settled, expected.settled, `${what}: write ${i}`))
        reads.forEach(({ actual, expected }, i) => equalSettled(actual.settled, expected.settled, `${what}: read ${i}`))
      }
      let step = 0
      for (const op of ops) {
        const what = `after op ${step++} ${JSON.stringify(op)}`
        switch (op.type) {
          case 'write':
            writes.push({ actual: track(channel.write(op.value)), expected: model.write(op.value) })
            break
          case 'read':
            reads.push({ actual: track(channel.next()), expected: model.read() })
            break
          case 'closeWriting':
            if (model.doneWriting) {
              assert.throws(() => channel.closeWriting(op.err), /already closed/, what)
            } else {
              channel.closeWriting(op.err)
              model.closeWriting(op.err)
            }
            break
          case 'close':
            channel.close(op.err)
            model.close(op.err)
            break
          case 'fail':
            channel.fail(op.err)
            model.fail(op.err)
            break
        }
        await flush()
        compare(what)
      }
      // Finish: everything still pending settles on close, and nothing is left behind.
      channel.close()
      model.close(undefined)
      await flush()
      compare('after final close')
      assert.ok(writes.every(({ actual }) => actual.settled.state !== 'pending'), 'a write is still pending after close')
      assert.ok(reads.every(({ actual }) => actual.settled.state !== 'pending'), 'a read is still pending after close')
      assert.equal(channel.pendingReads, 0)
      assert.equal(channel.pendingWrites, 0)
      // A closed channel stays closed.
      assert.deepEqual(await channel.next().then(result => result, (reason: unknown) => ({ rejected: reason })), model.failure ? { rejected: model.failure.error } : { done: true, value: undefined })
      await assert.rejects(channel.write(-1), /Channel closed/)
    }

for (const cap of [ 0, 1, 2, Infinity ]) {
  await test(`a channel with capacity ${cap} agrees with the reference model under random writes, reads, closes and failures`, async () => {
    await Testing.checkTrace({ seed: 0xc4a0 + (cap === Infinity ? 99 : cap), trials: 120, length: 30, op, run: runWith(cap) })
  })
}

await test('select over open channels yields every buffered value exactly once and completes once a channel is done', async () => {
  await Testing.checkTrace<number[]>({
    seed: 0x5e1e,
    trials: 60,
    length: 1,
    op: rng => Array.from({ length: rng.between(1, 4) }, () => rng.between(0, 5)),
    run: async cases => {
      for (const counts of cases) {
        const channels = counts.map(() => Ch.of<string>(Infinity))
        const expected: string[] = []
        counts.forEach((count, i) => {
          for (let j = 0; j < count; j++) {
            const value = `${i}:${j}`
            expected.push(value)
            channels[i].writeIgnore(value)
          }
        })
        // No channel is done, so exactly `expected.length` selections succeed, in any order.
        const seen: string[] = []
        for (let k = 0; k < expected.length; k++) {
          const result = await Ch.selectNext(...channels)
          assert.equal(result.done, false)
          seen.push(result.value)
        }
        assert.deepEqual(seen.sort(), expected.sort())
        assert.ok(channels.every(channel => channel.pendingWrites === 0))
        // A completed channel completes the selection.
        channels[0].closeWriting()
        assert.deepEqual(await Ch.selectNext(...channels), { done: true, value: undefined })
        channels.forEach(channel => channel.close())
      }
    }
  })
})
