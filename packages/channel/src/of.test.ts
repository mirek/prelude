import * as Ch from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const unhandled: unknown[] = []
const onUnhandled = (reason: unknown) => {
  unhandled.push(reason)
}
process.on('unhandledRejection', onUnhandled)

/** Lets queued microtasks and macrotasks settle. */
const settle = () => new Promise(resolve => setTimeout(resolve, 0))

await test('ofAsyncIterable streams values and completes', async () => {
  const source = async function* () {
    yield 1
    yield 2
    yield 3
  }
  const values: number[] = []
  for await (const value of Ch.ofAsyncIterable(source())) {
    values.push(value)
  }
  assert.deepEqual(values, [ 1, 2, 3 ])
})

await test('ofAsyncIterable propagates a throwing source to the consumer', async () => {
  const source = async function* () {
    yield 1
    yield 2
    throw new Error('source boom')
  }
  const ch = Ch.ofAsyncIterable(source())
  const values: number[] = []
  await assert.rejects(async () => {
    for await (const value of ch) {
      values.push(value)
    }
  }, /source boom/)
  assert.deepEqual(values, [ 1, 2 ])
  assert.equal(ch.failed, true)
  assert.equal((ch.error as Error).message, 'source boom')
  await assert.rejects(ch.read(), /source boom/)
  await assert.rejects(ch.next(), /source boom/)
  await settle()
  assert.deepEqual(unhandled, [])
})

await test('ofIterable propagates a throwing source to the consumer', async () => {
  const source = function* () {
    yield 1
    throw new Error('sync boom')
  }
  const ch = Ch.ofIterable(source())
  assert.equal(await ch.read(), 1)
  await assert.rejects(ch.read(), /sync boom/)
  await settle()
  assert.deepEqual(unhandled, [])
})

await test('failing a channel with pending reads rejects them', async () => {
  const ch = Ch.of<number>()
  const pending = ch.next()
  ch.fail(new Error('failed'))
  await assert.rejects(pending, /failed/)
  await assert.rejects(ch.maybeRead(), /failed/)
  assert.equal(ch.done, true)
})

await test('fail settles pending writes with the error and is idempotent after close', async () => {
  const ch = Ch.of<number>()
  const write = ch.write(1)
  ch.fail(new Error('failed'))
  await assert.rejects(write, /failed/)
  ch.fail(new Error('again'))
  assert.equal((ch.error as Error).message, 'failed')
  const closed = Ch.of<number>()
  closed.closeWriting()
  closed.fail(new Error('ignored'))
  assert.equal(closed.failed, false)
  assert.deepEqual(await closed.next(), { done: true, value: undefined })
})

await test('consumer closing a produced channel does not leak an unhandled rejection', async () => {
  const ch = Ch.ofIterable([ 1, 2, 3 ])
  assert.equal(await ch.read(), 1)
  ch.close(new Error('consumer gave up'))
  await settle()
  assert.deepEqual(unhandled, [])
  assert.equal(ch.failed, false)

  const source = async function* () {
    yield 1
    yield 2
    yield 3
  }
  const ach = Ch.ofAsyncIterable(source())
  assert.equal(await ach.read(), 1)
  ach.close(new Error('consumer gave up'))
  await settle()
  assert.deepEqual(unhandled, [])
  assert.equal(ach.failed, false)
})

process.off('unhandledRejection', onUnhandled)
