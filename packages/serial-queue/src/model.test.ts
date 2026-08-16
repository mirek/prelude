import * as Q from './index.js'
import * as Testing from '@prelude/testing'
import { test } from 'node:test'
import assert from 'node:assert/strict'

// Model-based check: tasks are pushed with a controllable outcome (they
// settle only when the trace says so), the queue is interleaved with
// rejectAll, and after every step the observable state must match a
// reference model: at most one task in flight, tasks started in push order,
// results delivered to the right promise, and rejectAll rejecting every
// queued entry (including the running one, whose eventual result is dropped).

type Op =
  | { type: 'push', outcome: 'ok' | 'error' | 'throw' }
  | { type: 'settle' }
  | { type: 'rejectAll' }

type Settled =
  | { state: 'pending' }
  | { state: 'resolved', value: string }
  | { state: 'rejected', reason: string }

const track =
  (promise: Promise<string>) => {
    const box: { settled: Settled } = { settled: { state: 'pending' } }
    promise.then(
      value => { box.settled = { state: 'resolved', value } },
      (reason: unknown) => { box.settled = { state: 'rejected', reason: reason instanceof Error ? reason.message : String(reason) } }
    )
    return box
  }

const flush =
  async () => {
    for (let i = 0; i < 6; i++) {
      await Promise.resolve()
    }
  }

const op =
  (rng: Testing.Prng): Op => {
    const roll = rng.float()
    if (roll < 0.45) return { type: 'push', outcome: rng.pick([ 'ok', 'ok', 'error', 'throw' ]) }
    if (roll < 0.9) return { type: 'settle' }
    return { type: 'rejectAll' }
  }

const run =
  async (ops: readonly Op[]) => {
    type Task = { id: number, outcome: 'ok' | 'error' | 'throw', settle?: () => void }
    const started: Task[] = []
    let running: undefined | Task
    let drained = 0
    const queue = Q.of(
      (task: Task) => {
        assert.equal(running, undefined, `task ${task.id} started while ${running?.id} is running`)
        started.push(task)
        if (task.outcome === 'throw') {
          throw new Error(`throw ${task.id}`)
        }
        running = task
        return new Promise<string>((resolve, reject) => {
          task.settle = () => {
            running = undefined
            if (task.outcome === 'ok') {
              resolve(`ok ${task.id}`)
            } else {
              reject(new Error(`error ${task.id}`))
            }
          }
        })
      },
      { drained: () => { drained++ } }
    )

    // Model.
    const tasks: Array<{ task: Task, actual: { settled: Settled }, expected: Settled }> = []
    let modelQueue: Task[] = []          // pushed and not yet finished, in order (head may be running)
    let modelRunning: undefined | Task    // in flight (also head of modelQueue unless rejected)
    let modelDrained = 0
    let nextId = 0

    const expectedOf = (task: Task) => tasks.find(entry => entry.task === task)!

    /** Runs the head of the model queue as long as it throws synchronously; leaves an async one running. */
    const modelStart = () => {
      while (modelQueue.length > 0 && modelRunning === undefined) {
        const task = modelQueue[0]
        if (task.outcome === 'throw') {
          modelQueue.shift()
          expectedOf(task).expected = { state: 'rejected', reason: `throw ${task.id}` }
          if (modelQueue.length === 0) {
            modelDrained++
          }
        } else {
          modelRunning = task
        }
      }
    }

    let step = 0
    for (const op of ops) {
      const what = `after op ${step++} ${JSON.stringify(op)}`
      switch (op.type) {
        case 'push': {
          const task: Task = { id: nextId++, outcome: op.outcome }
          tasks.push({ task, actual: track(Q.push(queue, task)), expected: { state: 'pending' } })
          modelQueue.push(task)
          modelStart()
          break
        }
        case 'settle': {
          if (running) {
            const task = running
            task.settle!()
            // The model: the running task finishes; its result reaches its promise unless rejectAll dropped it.
            modelRunning = undefined
            if (modelQueue[0] === task) {
              modelQueue.shift()
              expectedOf(task).expected = task.outcome === 'ok' ?
                { state: 'resolved', value: `ok ${task.id}` } :
                { state: 'rejected', reason: `error ${task.id}` }
              if (modelQueue.length === 0) {
                modelDrained++
              }
            }
            modelStart()
          }
          break
        }
        case 'rejectAll': {
          Q.rejectAll(queue, new Error('rejected'))
          if (modelQueue.length > 0) {
            for (const task of modelQueue) {
              expectedOf(task).expected = { state: 'rejected', reason: 'rejected' }
            }
            modelQueue = []
            modelDrained++
          }
          break
        }
      }
      await flush()
      assert.equal(queue.entries.length, modelQueue.length, `${what}: entries`)
      assert.equal(queue.running?.args[0], modelRunning, `${what}: running`)
      assert.equal(drained, modelDrained, `${what}: drained`)
      tasks.forEach(({ actual, expected }, i) => assert.deepEqual(actual.settled, expected, `${what}: task ${i}`))
      // Tasks start strictly in push order, and never more than one at a time (checked in f).
      assert.deepEqual(started.map(task => task.id), started.map(task => task.id).slice().sort((a, b) => a - b), `${what}: start order`)
    }
    // Drain whatever is left so no promise stays pending.
    while (running) {
      const task = running
      task.settle!()
      await flush()
    }
    Q.rejectAll(queue, new Error('rejected'))
    await flush()
    assert.ok(tasks.every(({ actual }) => actual.settled.state !== 'pending'), 'a task is still pending after draining')
    assert.equal(queue.entries.length, 0)
    assert.equal(queue.running, undefined)
  }

await test('a serial queue runs one task at a time in push order and settles every promise like the reference model', async () => {
  await Testing.checkTrace({ seed: 0x5e41, trials: 150, length: 30, op, run })
})
