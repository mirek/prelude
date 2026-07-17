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
