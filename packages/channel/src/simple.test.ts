import * as Ch from './index.js'
import * as Cmp from '@prelude/cmp'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('simple', async () => {
  const channel = Ch.of<number>()
  const timeline: unknown[] = []

  const writes = [ 3, 5, 7 ].map(value =>
    channel.write(value).then(() => {
      timeline.push([ 'enqueued', value ])
    })
  )

  let index = 0
  for await (const value of channel) {
    timeline.push([ 'processed', value ])
    if (++index === 3) {
      break
    }
  }
  await Promise.all(writes)

  assert.deepEqual(timeline, [
    [ 'enqueued', 3 ],
    [ 'processed', 3 ],
    [ 'enqueued', 5 ],
    [ 'processed', 5 ],
    [ 'enqueued', 7 ],
    [ 'processed', 7 ]
  ])
  assert.equal(channel.pendingReads, 0)
  assert.equal(channel.pendingWrites, 0)
})

await test('delayed receive', async () => {
  const delayedNumber =
    (value: number) => {
      const channel = Ch.of<number>()
      const write = Promise.resolve().then(() => channel.write(value))
      return { channel, write }
    }

  const a = delayedNumber(3)
  const b = delayedNumber(5)

  assert.deepEqual(await a.channel.read() + await b.channel.read(), 8)
  await Promise.all([ a.write, b.write ])
})

await test('two queued writes, two reads', async () => {
  const channel = Ch.of<number>()
  const writes = [ channel.write(3), channel.write(5) ]

  assert.deepEqual(await channel.read() + await channel.read(), 8)
  await Promise.all(writes)
  assert.equal(channel.pendingWrites, 0)
})

await test('async iterable consumer', async () => {
  const channel = Ch.of<number>()
  const producer = Promise.resolve()
    .then(() => channel.write(3))
    .then(() => channel.write(5))
    .then(async () => {
      await channel.write(7)
      channel.closeWriting()
    })
  const values: number[] = []
  for await (const value of channel) {
    values.push(value)
  }
  await producer
  assert.deepEqual(values, [ 3, 5, 7 ])
})

await test('concurrent map settles all workers without timers', async () => {
  type F<T, U> = (value: T, index: number, worker: number) => U | Promise<U>

  function unordered<T, U>(f: F<T, U>, concurrency: number) {
    return async function* (values: Iterable<T>) {
      let index = 0
      const input = Ch.ofIterable(values)
      const output = Ch.of<U>()
      const workers = Promise
        .allSettled(Array.from({ length: concurrency }, async (_, worker) => {
          for await (const value of input) {
            await output.write(await Promise.resolve(f(value, index++, worker)))
          }
        }))
        .finally(() => {
          output.closeWriting()
        })
      yield* output
      assert.ok((await workers).every(result => result.status === 'fulfilled'))
    }
  }

  const values = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]
  const result: number[] = []
  for await (const value of unordered(async input => {
    await Promise.resolve()
    return input * 2
  }, 3)(values)) {
    result.push(value)
  }
  assert.deepEqual(result.toSorted(Cmp.number), values.map(value => value * 2))
})
