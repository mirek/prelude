import * as RemoteClock from './index.js'
import { test, mock } from 'node:test'
import assert from 'node:assert/strict'

/** Lets the timer callback, the generator and the consumer run (mock timers only fake setTimeout). */
const settle = () => new Promise(resolve => setImmediate(resolve))

await test('midSeconds ticks once per second in the middle of the remote second and stops on abort', async () => {
  mock.timers.enable({ apis: [ 'setTimeout', 'Date' ], now: new Date('2000-01-01T00:00:00.100Z') })
  try {
    const clock = RemoteClock.of()
    const controller = new AbortController()
    const seen: number[] = []
    const consumer = (async () => {
      for await (const now of RemoteClock.midSeconds(clock, { signal: controller.signal })) {
        seen.push(now)
      }
    })()
    mock.timers.tick(400)
    await settle()
    assert.deepEqual(seen.map(now => new Date(now).toISOString()), [ '2000-01-01T00:00:00.500Z' ])
    mock.timers.tick(1000)
    await settle()
    assert.equal(seen.length, 2)
    controller.abort(new Error('stop'))
    await assert.rejects(consumer, /stop/)
    // The pending timer was cleared: advancing time produces no further tick.
    mock.timers.tick(5000)
    assert.equal(seen.length, 2)
  } finally {
    mock.timers.reset()
  }
})

await test('an already aborted signal makes midSeconds throw before the first tick', async () => {
  const generator = RemoteClock.midSeconds(RemoteClock.of(), { signal: AbortSignal.abort(new Error('never')) })
  await assert.rejects(generator.next(), /never/)
})

await test('midSecondsInterval stops on abort or through the returned function', () => {
  mock.timers.enable({ apis: [ 'setTimeout', 'Date' ], now: new Date('2000-01-01T00:00:00.100Z') })
  try {
    const clock = RemoteClock.of()
    const controller = new AbortController()
    const ticks: number[] = []
    const stop = RemoteClock.midSecondsInterval(clock, now => ticks.push(now), { signal: controller.signal })
    // Timers scheduled by a running timer callback are only due in a later tick() call.
    mock.timers.tick(400)
    mock.timers.tick(1000)
    assert.equal(ticks.length, 2)
    controller.abort()
    mock.timers.tick(5000)
    assert.equal(ticks.length, 2, 'no ticks after abort')
    stop()
    const stopped = RemoteClock.midSecondsInterval(clock, now => ticks.push(now))
    mock.timers.tick(1000)
    assert.equal(ticks.length, 3)
    stopped()
    mock.timers.tick(5000)
    assert.equal(ticks.length, 3)
    RemoteClock.midSecondsInterval(clock, now => ticks.push(now), { signal: AbortSignal.abort() })
    mock.timers.tick(5000)
    assert.equal(ticks.length, 3, 'an already aborted signal schedules nothing')
  } finally {
    mock.timers.reset()
  }
})
