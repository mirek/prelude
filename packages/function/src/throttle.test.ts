import * as F from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('throttle emits an immediate and one trailing call per window', () => {
  const callbacks: Array<() => void> = []
  const delays: number[] = []
  const scheduler = {
    setTimeout(callback: () => void, delay: number) {
      callbacks.push(callback)
      delays.push(delay)
    }
  }
  const calls: number[] = []
  const throttled = F.throttle(1_000, () => {
    calls.push(calls.length)
  }, scheduler)

  throttled()
  throttled()
  throttled()

  assert.deepEqual(calls, [ 0 ])
  assert.deepEqual(delays, [ 1_000 ])
  callbacks.shift()?.()

  assert.deepEqual(calls, [ 0, 1 ])
  assert.deepEqual(delays, [ 1_000, 1_000 ])
  callbacks.shift()?.()
  assert.equal(callbacks.length, 0)

  throttled()
  assert.deepEqual(calls, [ 0, 1, 2 ])
  callbacks.shift()?.()
  assert.equal(callbacks.length, 0)
})

await test('an aborted throttle clears its timer, drops the trailing call and ignores further calls', () => {
  const controller = new AbortController()
  const timers = new Map<number, () => void>()
  let cleared: unknown[] = []
  let next = 0
  let calls = 0
  const scheduler = {
    setTimeout: (callback: () => void) => { timers.set(++next, callback); return next },
    clearTimeout: (handle: unknown) => { cleared.push(handle); timers.delete(handle as number) }
  }
  const g = F.throttle(100, () => { calls++ }, scheduler, { signal: controller.signal })
  g()
  g()
  assert.equal(calls, 1)
  controller.abort()
  assert.deepEqual(cleared, [ 1 ], 'the pending timer is cleared on abort')
  assert.equal(timers.size, 0)
  g()
  assert.equal(calls, 1, 'calls after abort never reach f')
  // A scheduler without clearTimeout still works: the timer runs out and does nothing.
  const c2 = new AbortController()
  const pending: Array<() => void> = []
  const h = F.throttle(100, () => { calls++ }, { setTimeout: (callback: () => void) => { pending.push(callback) } }, { signal: c2.signal })
  h()
  h()
  c2.abort()
  pending.shift()!()
  assert.equal(calls, 2)
})
