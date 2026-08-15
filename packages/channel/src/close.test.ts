import * as Ch from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('breaking out of for-await after the producer closed writing does not throw', async () => {
  const ch = Ch.of<number>(1)
  await ch.write(1)
  ch.closeWriting()
  const values: number[] = []
  for await (const value of ch) {
    values.push(value)
    break
  }
  assert.deepEqual(values, [ 1 ])
  assert.equal(ch.done, true)
})

await test('close and return are idempotent', async () => {
  const ch = Ch.of<number>()
  ch.close()
  ch.close()
  assert.deepEqual(await ch.return(), { done: true, value: undefined })
  assert.deepEqual(await ch.next(), { done: true, value: undefined })

  const timer = Ch.after(1)
  await timer.next()
  timer.close()
  assert.equal(timer.done, true)
})

await test('close after closeWriting drains buffered writes', async () => {
  const ch = Ch.of<number>(2)
  await ch.write(1)
  await ch.write(2)
  ch.closeWriting()
  assert.equal(ch.pendingWrites, 2)
  ch.close()
  assert.equal(ch.pendingWrites, 0)
  assert.equal(ch.done, true)
})

await test('closeWriting twice is still rejected as a programming error', () => {
  const ch = Ch.of<number>()
  ch.closeWriting()
  assert.throws(() => ch.closeWriting(), /already closed for writing/)
})

await test('invalid capacities are rejected up front', () => {
  for (const cap of [ -1, 1.5, NaN, Infinity ]) {
    assert.throws(() => Ch.of(cap), RangeError, String(cap))
  }
  assert.equal(Ch.of(0).cap, 0)
  assert.equal(Ch.of(3).cap, 3)
})
