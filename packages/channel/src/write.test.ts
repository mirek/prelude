import * as Ch from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('write, read on semaphore', async () => {
  const channel = Ch.of<number>()
  const write = channel.write(3)

  assert.equal(channel.pendingWrites, 1)
  assert.deepEqual(await channel.read(), 3)
  await write
  assert.equal(channel.pendingWrites, 0)
})

await test('two pending writes are consumed and settled', async () => {
  const channel = Ch.of<number>()
  const firstWrite = channel.write(3)
  const secondWrite = channel.write(5)

  assert.equal(channel.pendingWrites, 2)
  const first = await channel.read()
  const second = await channel.read()
  await Promise.all([ firstWrite, secondWrite ])

  assert.equal(first + second, 8)
  assert.equal(channel.pendingReads, 0)
  assert.equal(channel.pendingWrites, 0)
})
