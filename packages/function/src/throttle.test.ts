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
