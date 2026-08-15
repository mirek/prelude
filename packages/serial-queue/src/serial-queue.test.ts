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
