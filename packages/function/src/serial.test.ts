import * as F from './index.js'
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

await test('serial starts one task at a time and settles every call', async () => {
  const gates = Array.from({ length: 3 }, () => deferred<void>())
  const started: number[] = []
  const completed: number[] = []

  const serial = F.serial(async (value: number) => {
    started.push(value)
    await gates[value].promise
    completed.push(value)
    return value * 2
  })

  const tasks = [ serial(0), serial(1), serial(2) ]
  assert.deepEqual(started, [ 0 ])

  gates[0].resolve()
  assert.equal(await tasks[0], 0)
  await Promise.resolve()
  assert.deepEqual(started, [ 0, 1 ])

  gates[1].resolve()
  assert.equal(await tasks[1], 2)
  await Promise.resolve()
  assert.deepEqual(started, [ 0, 1, 2 ])

  gates[2].resolve()
  assert.deepEqual(await Promise.all(tasks), [ 0, 2, 4 ])
  assert.deepEqual(completed, [ 0, 1, 2 ])
})

await test('serial continues after a rejected task', async () => {
  const first = deferred<void>()
  const started: number[] = []
  const serial = F.serial(async (value: number) => {
    started.push(value)
    if (value === 0) {
      await first.promise
      throw new Error('failed')
    }
    return value
  })

  const failed = serial(0)
  const succeeded = serial(1)
  assert.deepEqual(started, [ 0 ])

  first.resolve()
  await assert.rejects(failed, /failed/)
  assert.equal(await succeeded, 1)
  assert.deepEqual(started, [ 0, 1 ])
})
