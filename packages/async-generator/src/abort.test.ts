import * as G from './index.js'
import * as Ch from '@prelude/channel'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const abortError = (error: unknown) => error instanceof DOMException && error.name === 'AbortError'

/** An async iterable that yields on demand and records whether it was returned. */
const source = () => {
  const ch = Ch.of<number>(Infinity)
  let returned = false
  const iterable: AsyncIterable<number> = {
    [Symbol.asyncIterator]: () => {
      const iterator = ch[Symbol.asyncIterator]()
      return {
        next: () => iterator.next(),
        return: async () => { returned = true; ch.close(); return { done: true, value: undefined } }
      }
    }
  }
  return { ch, iterable, get returned() { return returned } }
}

await test('sleep rejects with the reason on abort and immediately when already aborted', async () => {
  const controller = new AbortController()
  const pending = G.sleep(10_000, { signal: controller.signal })
  controller.abort(new Error('stop'))
  await assert.rejects(pending, /stop/)
  await assert.rejects(G.sleep(1, { signal: AbortSignal.abort() }), abortError)
})

await test('a concurrent map throws the reason at once, stops pulling and returns the source', async () => {
  const controller = new AbortController()
  const { ch, iterable, returned } = source()
  void returned
  const started: number[] = []
  let finished = 0
  const results: number[] = []
  const consumer = (async () => {
    for await (const value of G.map(async (x: number) => {
      started.push(x)
      await G.sleep(20)
      finished++
      return x * 2
    }, { concurrency: 2, signal: controller.signal })(iterable)) {
      results.push(value)
    }
  })()
  ch.writeIgnore(1)
  ch.writeIgnore(2)
  ch.writeIgnore(3)
  await new Promise(resolve => setTimeout(resolve, 5))
  controller.abort(new Error('stop'))
  await assert.rejects(consumer, /stop/)
  assert.deepEqual(results, [], 'nothing was delivered')
  assert.deepEqual(started, [ 1, 2 ], 'the third value was never pulled')
  await new Promise(resolve => setTimeout(resolve, 40))
  assert.equal(finished, 2, 'in-flight mappings settle on their own')
})

await test('an unordered map and a concurrent tap abort the same way, and an aborted signal aborts before pulling', async () => {
  for (const transform of [
    (signal: AbortSignal) => G.map(async (x: number) => x, { concurrency: 3, preserveOrder: false, signal }),
    (signal: AbortSignal) => G.tap(async () => {}, { concurrency: 3, signal })
  ]) {
    const controller = new AbortController()
    const { ch, iterable } = source()
    const consumer = (async () => { for await (const _ of transform(controller.signal)(iterable)) { void _ } })()
    await new Promise(resolve => setTimeout(resolve, 5))
    controller.abort(new Error('stop'))
    await assert.rejects(consumer, /stop/)
    ch.close()
    let pulled = false
    const never: AsyncIterable<number> = { [Symbol.asyncIterator]: () => ({ next: async () => { pulled = true; return { done: true, value: undefined } } }) }
    await assert.rejects((async () => { for await (const _ of transform(AbortSignal.abort(new Error('never')))(never)) { void _ } })(), /never/)
    assert.equal(pulled, false)
  }
})

await test('serial map and tap check the signal between values', async () => {
  const controller = new AbortController()
  const seen: number[] = []
  const numbers = G.ofIterable([ 1, 2, 3, 4 ])
  await assert.rejects((async () => {
    for await (const value of G.map((x: number) => { if (x === 2) { controller.abort(new Error('stop')) } return x }, { signal: controller.signal })(numbers)) {
      seen.push(value)
    }
  })(), /stop/)
  assert.deepEqual(seen, [ 1, 2 ], 'the value being processed is still yielded, the next one is not pulled')
  const c2 = new AbortController()
  const tapped: number[] = []
  await assert.rejects((async () => {
    for await (const value of G.tap((x: number) => { tapped.push(x); if (x === 1) { c2.abort(new Error('stop')) } }, { signal: c2.signal })(G.ofIterable([ 1, 2, 3 ]))) {
      void value
    }
  })(), /stop/)
  assert.deepEqual(tapped, [ 1 ])
})

await test('consume stops pulling on abort, returns the source, awaits in-flight callbacks and rejects with the reason', async () => {
  const controller = new AbortController()
  const holder = source()
  const seen: number[] = []
  let settled = 0
  const done = G.consume(async (value: number) => {
    seen.push(value)
    await G.sleep(20)
    settled++
  }, { concurrency: 2, signal: controller.signal })(holder.iterable)
  holder.ch.writeIgnore(1)
  holder.ch.writeIgnore(2)
  holder.ch.writeIgnore(3)
  await new Promise(resolve => setTimeout(resolve, 5))
  controller.abort(new Error('stop'))
  await assert.rejects(done, /stop/)
  assert.equal(holder.returned, true, 'the source was returned')
  assert.equal(settled, 2, 'in-flight callbacks were awaited before rejecting')
  assert.deepEqual(seen, [ 1, 2 ])
  let pulled = false
  const never: AsyncIterable<number> = { [Symbol.asyncIterator]: () => ({ next: async () => { pulled = true; return { done: true, value: undefined } } }) }
  await assert.rejects(G.consume(() => {}, { signal: AbortSignal.abort(new Error('never')) })(never), /never/)
  assert.equal(pulled, false)
})

await test('ofInterval clears its interval and throws the reason on abort', async () => {
  const controller = new AbortController()
  let ticks = 0
  const consumer = (async () => {
    for await (const _ of G.ofInterval(5, { signal: controller.signal })) {
      void _
      if (++ticks === 2) {
        controller.abort(new Error('stop'))
      }
    }
  })()
  await assert.rejects(consumer, /stop/)
  const count = ticks
  await new Promise(resolve => setTimeout(resolve, 30))
  assert.equal(ticks, count)
  await assert.rejects(G.ofInterval(1, { signal: AbortSignal.abort(new Error('never')) }).next(), /never/)
})

await test('jitter cuts a pending delay short on abort', async () => {
  const controller = new AbortController()
  const seen: number[] = []
  const start = Date.now()
  const consumer = (async () => {
    for await (const value of G.jitter<number>(0, 10_000, { signal: controller.signal })(G.ofIterable([ 1, 2, 3 ]))) {
      seen.push(value)
      if (value === 1) {
        setTimeout(() => controller.abort(new Error('stop')), 5)
      }
    }
  })()
  await assert.rejects(consumer, /stop/)
  assert.deepEqual(seen, [ 1 ])
  assert.ok(Date.now() - start < 1000)
})
