import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  const promise = new Promise<T>(resolve_ => {
    resolve = resolve_
  })
  return { promise, resolve }
}

const settle = () => new Promise(resolve => setTimeout(resolve, 0))

await test('ordered concurrent map does not drain the source while the head of the line is blocked', async () => {
  const gate = deferred()
  let pulled = 0
  const source = async function* () {
    for (let i = 0; i < 10_000; i++) {
      pulled++
      yield i
    }
  }
  const mapped = G.map(async (value: number) => {
    if (value === 0) {
      await gate.promise
    }
    return value
  }, { concurrency: 3 })(source())
  const first = mapped.next()
  await settle()
  await settle()
  assert.ok(pulled <= 10, `only a bounded window is pulled while item 0 blocks, saw ${pulled}`)
  gate.resolve()
  assert.deepEqual(await first, { done: false, value: 0 })
  const rest: number[] = []
  for await (const value of mapped) {
    rest.push(value)
  }
  assert.equal(rest.length, 9999)
  assert.deepEqual(rest.slice(0, 5), [ 1, 2, 3, 4, 5 ])
  assert.equal(pulled, 10_000)
})

await test('ordered concurrent map still overlaps work and keeps order', async () => {
  const gates = Array.from({ length: 4 }, () => deferred())
  let active = 0
  let maximumActive = 0
  const result = G.pipe(
    G.ofIterable([ 0, 1, 2, 3 ]),
    G.map(async value => {
      active++
      maximumActive = Math.max(maximumActive, active)
      await gates[value].promise
      active--
      return value * 10
    }, { concurrency: 3 }),
    G.array
  )
  await settle()
  assert.equal(maximumActive, 3)
  // Finish out of order: 2, 1, 0, then 3.
  gates[2].resolve()
  gates[1].resolve()
  await settle()
  gates[0].resolve()
  await settle()
  gates[3].resolve()
  assert.deepEqual(await result, [ 0, 10, 20, 30 ])
})

await test('an error while others wait for their turn still rejects promptly', async () => {
  const gate = deferred()
  const result = G.pipe(
    G.ofIterable([ 0, 1, 2 ]),
    G.map(async (value: number) => {
      if (value === 0) {
        await gate.promise
        throw new Error('head boom')
      }
      return value
    }, { concurrency: 3 }),
    G.array
  )
  await settle()
  gate.resolve()
  await assert.rejects(result, /head boom/)
})

await test('invalid concurrency is rejected up front', () => {
  for (const concurrency of [ 0, -1, 1.5, NaN, Infinity ]) {
    assert.throws(() => G.map(async (x: number) => x, { concurrency }), RangeError, String(concurrency))
    assert.throws(() => G.tap(() => {}, { concurrency }), RangeError, String(concurrency))
    assert.throws(() => G.consume(() => {}, { concurrency }), RangeError, String(concurrency))
  }
})
