import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('jitter delays between values, not after the last one', async () => {
  const start = performance.now()
  const seen: number[] = []
  const timestamps: number[] = []
  for await (const value of G.jitter<number>(0, 40)(G.ofIterable([ 1, 2, 3 ]))) {
    seen.push(value)
    timestamps.push(performance.now() - start)
  }
  const total = performance.now() - start
  assert.deepEqual(seen, [ 1, 2, 3 ])
  assert.ok(timestamps[0] < 30, `first value is immediate (${timestamps[0]}ms)`)
  assert.ok(timestamps[1] >= 35 && timestamps[2] >= 70, `values are spaced (${timestamps.join(', ')})`)
  assert.ok(total < 110, `no trailing delay after the last value (${total}ms)`)
})
