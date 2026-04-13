import * as G from './index.js'
import sleep from './sleep.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('concurrent', async () => {
  let taps = 0
  assert.deepEqual(await G.pipe(
    G.ofInterval(100),
    G.tap(async () => {
      await sleep(Math.random() * 10) // NOSONAR
      taps++
    }, { concurrency: 10 }),
    G.map(_ => _.index),
    G.take(20),
    G.array
  ), Array.from({ length: 20 }, (_, i) => i))
  assert.equal(taps, 20)
})
