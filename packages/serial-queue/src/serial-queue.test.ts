import * as Q from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolve_, reject_) => {
    resolve = resolve_
    reject = reject_
  })
  return { promise, resolve, reject }
}

await test('queue executes entries serially and settles every push', async () => {
  const gates = Array.from({ length: 4 }, () => deferred<void>())
  const started: number[] = []
  const completed: number[] = []
  const queue = Q.of(async (value: number) => {
    started.push(value)
    await gates[value].promise
    completed.push(value)
    return value * 10
  })

  const tasks = Array.from({ length: 4 }, (_, value) => Q.push(queue, value))
  assert.deepEqual(started, [ 0 ])
  assert.equal(queue.entries.length, 4)

  for (let index = 0; index < gates.length; index += 1) {
    gates[index].resolve()
    assert.equal(await tasks[index], index * 10)
    await Promise.resolve()
    assert.deepEqual(started, Array.from({ length: Math.min(index + 2, 4) }, (_, value) => value))
  }

  assert.deepEqual(await Promise.all(tasks), [ 0, 10, 20, 30 ])
  assert.deepEqual(completed, [ 0, 1, 2, 3 ])
  assert.equal(queue.entries.length, 0)
})

await test('queue continues after rejection and drains cleanly', async () => {
  const gate = deferred<void>()
  const started: number[] = []
  const queue = Q.of(async (value: number) => {
    started.push(value)
    if (value === 0) {
      await gate.promise
      throw new Error('failed')
    }
    return value
  })

  const failed = Q.push(queue, 0)
  const succeeded = Q.push(queue, 1)
  gate.resolve()

  await assert.rejects(failed, /failed/)
  assert.equal(await succeeded, 1)
  assert.deepEqual(started, [ 0, 1 ])
  assert.equal(queue.entries.length, 0)
})

await test('a long run of synchronously throwing entries settles without overflowing the stack', async () => {
  const gate = deferred<void>()
  const queue = Q.of((value: number) => {
    if (value === 0) {
      return gate.promise.then(() => 0)
    }
    throw new Error(`sync ${value}`)
  })
  const tasks = Array.from({ length: 20000 }, (_, value) => Q.push(queue, value))
  gate.resolve()
  assert.equal(await tasks[0], 0)
  const settled = await Promise.allSettled(tasks.slice(1))
  assert.ok(settled.every(result => result.status === 'rejected'))
  assert.equal((settled.at(-1) as PromiseRejectedResult).reason.message, 'sync 19999')
  assert.equal(queue.entries.length, 0)
})

await test('push after rejectAll waits for the in-flight entry to settle', async () => {
  const gate = deferred<void>()
  let running = 0
  let maximumRunning = 0
  const started: number[] = []
  const queue = Q.of(async (value: number) => {
    running += 1
    maximumRunning = Math.max(maximumRunning, running)
    started.push(value)
    if (value === 0) {
      await gate.promise
    }
    running -= 1
    return value
  })
  const first = Q.push(queue, 0)
  Q.rejectAll(queue, new Error('reset'))
  await assert.rejects(first, /reset/)
  const second = Q.push(queue, 1)
  await Promise.resolve()
  assert.deepEqual(started, [ 0 ])
  gate.resolve()
  assert.equal(await second, 1)
  assert.equal(maximumRunning, 1)
  assert.deepEqual(started, [ 0, 1 ])
  assert.equal(queue.entries.length, 0)
})

/**
 * Runs `f` while collecting uncaught exceptions into `errors`, keeping them
 * away from the test runner (which would otherwise fail the whole file).
 */
async function withUncaughtExceptions<T>(f: (errors: unknown[]) => Promise<T>): Promise<T> {
  const errors: unknown[] = []
  const listeners = process.rawListeners('uncaughtException')
  process.removeAllListeners('uncaughtException')
  process.on('uncaughtException', err => { errors.push(err) })
  try {
    return await f(errors)
  } finally {
    process.removeAllListeners('uncaughtException')
    for (const listener of listeners) {
      // rawListeners is typed as Function[] in @types/node 22.
      process.on('uncaughtException', listener as NodeJS.UncaughtExceptionListener)
    }
  }
}

/** Rejects if `promise` has not settled within `ms`. */
const withinMs = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`still pending after ${ms}ms`)), ms))
  ])

await test('a throwing drained hook does not keep the last entry from settling', async () => {
  await withUncaughtExceptions(async errors => {
    const queue = Q.of(async (value: number) => value * 2)
    queue.drained = () => { throw new Error('boom') }
    assert.equal(await withinMs(Q.push(queue, 21), 100), 42)
    assert.equal(queue.entries.length, 0)
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.deepEqual(errors.map(err => (err as Error).message), [ 'boom' ])
  })
})

await test('a throwing drained hook does not mask a synchronously throwing f', async () => {
  await withUncaughtExceptions(async errors => {
    const queue = Q.of((_: number): Promise<number> => { throw new Error('sync boom') })
    queue.drained = () => { throw new Error('boom') }
    await assert.rejects(withinMs(Q.push(queue, 1), 100), /sync boom/)
    assert.equal(queue.entries.length, 0)
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.deepEqual(errors.map(err => (err as Error).message), [ 'boom' ])
  })
})

await test('rejectAll rejects every entry even when the drained hook throws', async () => {
  await withUncaughtExceptions(async errors => {
    const gate = deferred<void>()
    const queue = Q.of(async (value: number) => {
      await gate.promise
      return value
    })
    queue.drained = () => { throw new Error('boom') }
    const tasks = [ Q.push(queue, 0), Q.push(queue, 1) ]
    Q.rejectAll(queue, new Error('reset'))
    for (const task of tasks) {
      await assert.rejects(withinMs(task, 100), /reset/)
    }
    assert.equal(queue.entries.length, 0)
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.deepEqual(errors.map(err => (err as Error).message), [ 'boom' ])
    gate.resolve()
  })
})

await test('aborting a queued entry removes it and rejects with the reason; the rest of the queue is unaffected', async () => {
  const started: number[] = []
  const gates: Array<() => void> = []
  const queue = Q.of((id: number) => new Promise<number>(resolve => { started.push(id); gates.push(() => resolve(id)) }))
  const first = Q.push(queue, 1)
  const controller = new AbortController()
  const second = Q.pushWith(queue, { signal: controller.signal }, 2)
  const third = Q.push(queue, 3)
  assert.equal(queue.entries.length, 3)
  controller.abort(new Error('stop'))
  await assert.rejects(second, /stop/)
  assert.equal(queue.entries.length, 2)
  gates.shift()!()
  assert.equal(await first, 1)
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.deepEqual(started, [ 1, 3 ], 'the aborted entry never runs')
  gates.shift()!()
  assert.equal(await third, 3)
})

await test('aborting the running entry rejects its promise, drops its result and lets the queue continue', async () => {
  const gates: Array<() => void> = []
  let drained = 0
  const queue = Q.of((id: number) => new Promise<number>(resolve => { gates.push(() => resolve(id)) }), { drained: () => { drained++ } })
  const controller = new AbortController()
  const running = Q.pushWith(queue, { signal: controller.signal }, 1)
  const following = Q.push(queue, 2)
  assert.equal(queue.running?.args[0], 1)
  controller.abort(new Error('stop'))
  await assert.rejects(running, /stop/)
  assert.equal(queue.entries.length, 1, 'the running entry is removed, the next one still queued')
  assert.equal(gates.length, 1, 'the next entry does not start while the aborted one is in flight')
  gates.shift()!()
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(gates.length, 1, 'the next entry starts once the aborted one settled')
  gates.shift()!()
  assert.equal(await following, 2)
  assert.equal(drained, 1)
})

await test('aborting the only queued entry drains the queue; an already aborted signal never queues', async () => {
  let drained = 0
  const queue = Q.of(async (id: number) => id, { drained: () => { drained++ } })
  const controller = new AbortController()
  const only = Q.pushWith(queue, { signal: controller.signal }, 1)
  // It is running (queue was idle), so it settles normally; abort afterwards is a no-op.
  assert.equal(await only, 1)
  controller.abort()
  assert.equal(drained, 1)
  await assert.rejects(Q.pushWith(queue, { signal: AbortSignal.abort(new Error('never')) }, 2), /never/)
  assert.equal(queue.entries.length, 0)
  assert.equal(drained, 1)
})
