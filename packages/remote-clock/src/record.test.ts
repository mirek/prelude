import * as RemoteClock from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('the first measurement replaces the unsynchronised placeholder', () => {
  const clock = RemoteClock.of()
  assert.equal(RemoteClock.offset(clock), 0)
  RemoteClock.record(clock, { before: 1000, remote: 3_601_020, after: 1040 })
  assert.equal(RemoteClock.offset(clock), 3_600_000)
  assert.equal(clock.samples, 1)
})

await test('later measurements are blended, weighted by latency', () => {
  const clock = RemoteClock.of()
  let local = 1_000_000
  for (let i = 0; i < 4; i++) {
    RemoteClock.record(clock, { before: local, remote: local + 20 + 3_600_000, after: local + 40 })
    local += 1000
  }
  assert.ok(Math.abs(RemoteClock.offset(clock) - 3_600_000) < 1, `offset error ${RemoteClock.offset(clock) - 3_600_000}`)
  assert.equal(clock.samples, 4)
  // A slow, wildly different sample moves the estimate only a little.
  RemoteClock.record(clock, { before: local, remote: local + 5000 + 3_700_000, after: local + 10_000 })
  assert.ok(Math.abs(RemoteClock.offset(clock) - 3_600_000) < 1000)
})

await test('a clock created from a measurement is already synchronised', () => {
  const clock = RemoteClock.of({ before: 0, remote: 5000, after: 2000 })
  assert.equal(clock.samples, 1)
  RemoteClock.record(clock, { before: 10_000, remote: 15_000, after: 12_000 })
  assert.equal(clock.samples, 2)
  assert.equal(RemoteClock.offset(clock), 4000)
})
