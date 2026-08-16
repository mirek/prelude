import * as G from './index.js'
import { mock, test } from 'node:test'
import assert from 'node:assert/strict'

/** Drains the microtask queue (setImmediate is not mocked) so pending promise chains settle. */
function flush() {
  return new Promise<void>(resolve => setImmediate(resolve))
}

/** Starts pulling the next value and reports whether it has settled, without hanging on a stuck iterator. */
function pull<T>(iterator: AsyncIterator<T>) {
  const state = { settled: false, result: undefined as IteratorResult<T> | undefined }
  const promise = iterator.next().then(result => {
    state.settled = true
    state.result = result
    return result
  })
  return { promise, state }
}

await test('jitter delays between values, not after the last one', async () => {
  mock.timers.enable({ apis: [ 'setTimeout' ] })
  try {
    // jitter of 0 with a base delay of 40 sleeps exactly 40ms whatever Math.random returns.
    const iterator = G.jitter<number>(0, 40)(G.ofIterable([ 1, 2, 3 ]))

    // The first value is yielded without any timer.
    const first = pull(iterator)
    await flush()
    assert.deepEqual(first.state, { settled: true, result: { value: 1, done: false } })

    // Every following value waits for the full delay.
    for (const value of [ 2, 3 ]) {
      const next = pull(iterator)
      // Let the transformer pull the value and schedule its sleep before advancing the clock.
      await flush()
      mock.timers.tick(39)
      await flush()
      assert.equal(next.state.settled, false, `value ${value} is not yielded before the delay elapses`)
      mock.timers.tick(1)
      await flush()
      assert.deepEqual(next.state, { settled: true, result: { value, done: false } })
    }

    // Nothing is waited after the last value: completion needs no tick.
    const done = pull(iterator)
    await flush()
    assert.deepEqual(done.state, { settled: true, result: { value: undefined, done: true } })
  } finally {
    mock.timers.reset()
  }
})
