import * as Ch from './index.js'
import { sleep } from './test.js'
import * as Cmp from '@prelude/cmp'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('simple', async () => {
  const ch = Ch.of<number>()
  const timeline: unknown[] = []

  void ch.write(3).then(() => timeline.push([ 'enqueued', 3 ]))
  void ch.write(5).then(() => timeline.push([ 'enqueued', 5 ]))
  void ch.write(7).then(() => timeline.push([ 'enqueued', 7 ]))

  let i = 0
  for await (const value of ch) {
    timeline.push([ 'processed', value ])
    if (++i === 3) {
      break
    }
  }

  assert.deepEqual(timeline, [
    [ 'enqueued', 3 ],
    [ 'processed', 3 ],
    [ 'enqueued', 5 ],
    [ 'processed', 5 ],
    [ 'enqueued', 7 ],
    [ 'processed', 7 ]
  ])
})

await test('delayed receive', async () => {
  const delayedNumber =
    (value: number) => {
      const ch = Ch.of<number>()
      void Promise.resolve().then(() => ch.write(value))
      return ch
    }

  const a = delayedNumber(3)
  const b = delayedNumber(5)

  assert.deepEqual(await a.read() + await b.read(), 8)
})

await test('two delayed writes, two reads', async () => {
  const a = Ch.of<number>()
  // Use immediate writes instead of random delays to avoid timing issues
  void Promise.resolve().then(() => a.write(3))
  void Promise.resolve().then(() => a.write(5))
  assert.deepEqual(await a.read() + await a.read(), 8)
})

await test('async iterable consumer', async () => {
  const ch = Ch.of<number>()
  // Use promise chain to ensure order without timing dependencies
  void Promise.resolve()
    .then(() => ch.write(3))
    .then(() => ch.write(5))
    .then(async () => {
      await ch.write(7)
      ch.closeWriting()
    })
  const values: number[] = []
  for await (const value of ch) {
    values.push(value)
  }
  assert.deepEqual(values, [ 3, 5, 7 ])
})

await test('concurrent map', async () => {

  type F<T, U> = (value: T, index: number, worker: number) => U | Promise<U>

  function unordered<T, U>(f: F<T, U>, concurrency: number) {
    return async function* (values: Iterable<T>) {
      let index = 0
      const input = Ch.ofIterable(values)
      const output = Ch.of<U>()
      void Promise
        .allSettled(Array.from({ length: concurrency }, async (_, worker) => {
          for await (const value of input) {
            await output.write(await Promise.resolve(f(value, index++, worker)))
          }
        }))
        .finally(() => {
          output.closeWriting()
        })
      yield* output
    }
  }

  const f = async (value: number) => {
    await sleep(10)
    return value * 2
  }

  const values = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]
  const result: number[] = []
  for await (const value of unordered(f, 3)(values)) {
    result.push(value)
  }
  assert.deepEqual(result.toSorted(Cmp.number), values.map(v => v * 2))

})
