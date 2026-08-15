import * as RemoteClock from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('offset is remote minus local midpoint', () => {
  // Round trip observed locally at 0..2000, the remote reported 5000 in the middle: remote leads by 4000.
  const ahead = RemoteClock.of({ before: 0, remote: 5000, after: 2000 })
  assert.equal(RemoteClock.offset(ahead), 4000)
  assert.equal(RemoteClock.now(ahead, 1000), 5000)
  assert.equal(RemoteClock.date(ahead, 1000).getTime(), 5000)

  const behind = RemoteClock.of({ before: 10_000, remote: 8000, after: 12_000 })
  assert.equal(RemoteClock.offset(behind), -3000)
  assert.equal(RemoteClock.now(behind, 11_000), 8000)

  const synced = RemoteClock.of()
  assert.equal(RemoteClock.offset(synced), 0)
  assert.equal(RemoteClock.now(synced, 123), 123)
})

await test('mid-second scheduling follows the remote clock', () => {
  const ahead = RemoteClock.of({ before: 0, remote: 1250, after: 2000 }) // remote leads by 250 ms
  // Local 1000 is remote 1250: 250 ms to the next remote mid-second (1500).
  assert.equal(RemoteClock.nextMidSecondOffset(ahead, 1000), 250)
})
