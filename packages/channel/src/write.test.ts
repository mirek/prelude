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

await test('fail with a falsy reason still rejects a blocked write', async () => {
  for (const reason of [ undefined, null, false, 0 ]) {
    const ch = Ch.of<number>()
    const write = ch.write(1)
    ch.fail(reason)
    assert.equal(ch.failed, true)
    await assert.rejects(write, err => err === reason, `fail(${String(reason)})`)
    await assert.rejects(ch.read(), err => err === reason)
  }
  const ch = Ch.of<number>()
  const write = ch.write(1)
  ch.fail(new Error('real'))
  await assert.rejects(write, /real/)
})

await test('a blocked write rejected while a doneWriting callback drains the channel gets the failure reason', async () => {
  const ch = Ch.of<number>()
  const write = ch.write(1)
  // Runs after `fail()` recorded the reason but before `closeWriting()` settled the write.
  ch.onceDoneWriting(() => ch.close())
  ch.fail(new Error('real'))
  await assert.rejects(write, /real/)
  const ch0 = Ch.of<number>()
  const write0 = ch0.write(1)
  ch0.onceDoneWriting(() => ch0.close())
  ch0.fail(0)
  await assert.rejects(write0, err => err === 0)
})

await test('closeWriting without a reason resolves a blocked write', async () => {
  const ch = Ch.of<number>()
  const write = ch.write(1)
  ch.closeWriting()
  await write
  assert.equal(ch.failed, false)
})
