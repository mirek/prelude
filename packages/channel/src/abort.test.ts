import * as Ch from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const abortError = (error: unknown) => error instanceof DOMException && error.name === 'AbortError'

await test('aborting a pending read withdraws it and rejects with the reason; the value stays for the next reader', async () => {
  const ch = Ch.of<number>()
  const controller = new AbortController()
  const pending = ch.read({ signal: controller.signal })
  assert.equal(ch.pendingReads, 1)
  controller.abort(new Error('stop'))
  await assert.rejects(pending, /stop/)
  assert.equal(ch.pendingReads, 0)
  ch.writeIgnore(1)
  assert.equal(await ch.read(), 1)
})

await test('an already aborted signal rejects read, maybeRead and write without touching the channel', async () => {
  const ch = Ch.of<number>(1)
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(ch.read({ signal: controller.signal }), abortError)
  await assert.rejects(ch.maybeRead({ signal: controller.signal }), abortError)
  await assert.rejects(ch.write(1, { signal: controller.signal }), abortError)
  assert.equal(await ch.maybeWrite(1, { signal: controller.signal }), false)
  assert.equal(ch.pendingReads, 0)
  assert.equal(ch.pendingWrites, 0)
})

await test('aborting a blocked write withdraws it: the value is never delivered', async () => {
  const ch = Ch.of<number>()
  const controller = new AbortController()
  const pending = ch.write(1, { signal: controller.signal })
  assert.equal(ch.pendingWrites, 1)
  controller.abort(new Error('stop'))
  await assert.rejects(pending, /stop/)
  assert.equal(ch.pendingWrites, 0)
  ch.writeIgnore(2)
  assert.equal(await ch.read(), 2)
})

await test('an accepted write is unaffected by a later abort and detaches from the signal', async () => {
  const ch = Ch.of<number>(1)
  const controller = new AbortController()
  await ch.write(1, { signal: controller.signal })
  controller.abort(new Error('late'))
  assert.equal(await ch.read(), 1)
  const unbuffered = Ch.of<number>()
  const c2 = new AbortController()
  const pending = unbuffered.write(2, { signal: c2.signal })
  assert.equal(await unbuffered.read(), 2)
  await pending
  c2.abort()
  assert.equal(unbuffered.pendingWrites, 0)
})

await test('a read settled by close or fail ignores a later abort', async () => {
  const ch = Ch.of<number>()
  const controller = new AbortController()
  const pending = ch.read({ signal: controller.signal })
  ch.close()
  await assert.rejects(pending, /Channel closed/)
  controller.abort()
  const failed = Ch.of<number>()
  const c2 = new AbortController()
  const pendingFailed = failed.maybeRead({ signal: c2.signal })
  failed.fail(new Error('boom'))
  await assert.rejects(pendingFailed, /boom/)
  c2.abort()
})

await test('aborting a select withdraws every attempt and rejects with the reason', async () => {
  const a = Ch.of<number>()
  const b = Ch.of<string>()
  const controller = new AbortController()
  const pending = Ch.selectNext({ signal: controller.signal }, a, b.writeAttempt('x', value => ({ done: false, value })))
  assert.equal(a.pendingReads, 1)
  assert.equal(b.pendingWrites, 1)
  controller.abort(new Error('stop'))
  await assert.rejects(pending, /stop/)
  assert.equal(a.pendingReads, 0)
  assert.equal(b.pendingWrites, 0)
  await assert.rejects(Ch.selectNext({ signal: controller.signal }, a), /stop/)
  // Without a signal the same call keeps working, and a ready attempt still wins synchronously.
  a.writeIgnore(3)
  assert.deepEqual(await Ch.selectNext({ signal: new AbortController().signal }, a, b), { done: false, value: 3 })
})

await test('a select generator throws the abort reason and releases its attempts', async () => {
  const a = Ch.of<number>()
  const controller = new AbortController()
  const seen: number[] = []
  const consumer = (async () => {
    for await (const value of Ch.select({ signal: controller.signal }, a)) {
      seen.push(value)
    }
  })()
  await a.write(1)
  controller.abort(new Error('stop'))
  await assert.rejects(consumer, /stop/)
  assert.deepEqual(seen, [ 1 ])
  assert.equal(a.pendingReads, 0)
})

await test('a settled select detaches from the signal', async () => {
  const a = Ch.of<number>()
  const controller = new AbortController()
  const pending = Ch.selectNext({ signal: controller.signal }, a)
  a.writeIgnore(1)
  assert.deepEqual(await pending, { done: false, value: 1 })
  controller.abort()
  assert.equal(a.pendingReads, 0)
})

await test('aborting after() fails the channel with the reason and clears the timer', async () => {
  const controller = new AbortController()
  const ch = Ch.after(10_000, { signal: controller.signal })
  const pending = ch.read()
  controller.abort(new Error('stop'))
  await assert.rejects(pending, /stop/)
  assert.equal(ch.failed, true)
  const already = Ch.after(10, { signal: AbortSignal.abort(new Error('never')) })
  await assert.rejects(already.next(), /never/)
})

await test('aborting a channel of an iterable fails it and stops the producer', async () => {
  const controller = new AbortController()
  let produced = 0
  const source = (function* () {
    while (true) {
      yield produced++
    }
  })()
  const ch = Ch.ofIterable(source, 0, { signal: controller.signal })
  assert.equal(await ch.read(), 0)
  controller.abort(new Error('stop'))
  await assert.rejects(ch.read(), /stop/)
  const before = produced
  await new Promise(resolve => setTimeout(resolve, 5))
  assert.equal(produced, before, 'no more values are pulled')
  assert.deepEqual(source.next(), { done: true, value: undefined }, 'the source iterator was returned')
})

await test('aborting a channel of an async iterable returns the source after its in-flight pull', async () => {
  const controller = new AbortController()
  let returned = false
  let pulls = 0
  const source: AsyncIterable<number> = {
    [Symbol.asyncIterator]: () => ({
      next: async () => ({ done: false, value: pulls++ }),
      return: async () => { returned = true; return { done: true, value: undefined } }
    })
  }
  const ch = Ch.ofAsyncIterable(source, 0, { signal: controller.signal })
  assert.equal(await ch.read(), 0)
  controller.abort(new Error('stop'))
  await assert.rejects(ch.read(), /stop/)
  await new Promise(resolve => setTimeout(resolve, 5))
  assert.equal(returned, true)
  assert.ok(pulls <= 3, `stopped pulling (${pulls})`)
})

await test('an already aborted signal makes ofIterable and ofAsyncIterable fail without touching the source', async () => {
  let pulled = 0
  const sync = { [Symbol.iterator]: () => ({ next: () => { pulled++; return { done: false, value: pulled } } }) }
  const asyncSource = { [Symbol.asyncIterator]: () => ({ next: async () => { pulled++; return { done: false, value: pulled } } }) }
  const signal = AbortSignal.abort(new Error('never'))
  await assert.rejects(Ch.ofIterable(sync, 0, { signal }).read(), /never/)
  await assert.rejects(Ch.ofAsyncIterable(asyncSource, 0, { signal }).read(), /never/)
  await new Promise(resolve => setTimeout(resolve, 5))
  assert.equal(pulled, 0)
})
