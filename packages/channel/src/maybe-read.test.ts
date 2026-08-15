import { Channel } from './channel.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('maybeRead returns a buffered value', async () => {
  const channel = new Channel<number>(1)

  await channel.write(42)

  assert.equal(await channel.maybeRead(), 42)
})

await test('maybeRead waits for an unbuffered value', async () => {
  const channel = new Channel<number>()
  const read = channel.maybeRead()

  assert.equal(channel.pendingReads, 1)
  await channel.write(42)

  assert.equal(await read, 42)
  assert.equal(channel.pendingReads, 0)
})

await test('maybeRead returns undefined for a queued undefined value', async () => {
  const channel = new Channel<undefined>(1)

  await channel.write(undefined)

  assert.equal(await channel.maybeRead(), undefined)
  assert.equal(channel.done, false)
})

await test('next distinguishes a queued undefined value from completion', async () => {
  const channel = new Channel<undefined>(1)

  await channel.write(undefined)
  assert.deepEqual(await channel.next(), { done: false, value: undefined })

  channel.closeWriting()
  assert.deepEqual(await channel.next(), { done: true, value: undefined })
})

await test('maybeRead returns undefined when a waiting reader is closed', async () => {
  const channel = new Channel<number>()
  const read = channel.maybeRead()

  assert.equal(channel.pendingReads, 1)
  channel.closeWriting()

  assert.equal(await read, undefined)
  assert.equal(channel.pendingReads, 0)
})

await test('maybeRead returns undefined immediately for a completed channel', async () => {
  const channel = new Channel<number>()
  channel.closeWriting()

  assert.equal(await channel.maybeRead(), undefined)
})

await test('read and next preserve their success and completion branches', async () => {
  const channel = new Channel<number>(1)

  await channel.write(42)
  assert.equal(await channel.read(), 42)

  channel.closeWriting()
  await assert.rejects(channel.read(), /Channel closed\./)
  assert.deepEqual(await channel.next(), { done: true, value: undefined })
})
