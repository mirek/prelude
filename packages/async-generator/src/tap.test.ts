import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  const promise = new Promise<T>(resolve_ => {
    resolve = resolve_
  })
  return { promise, resolve }
}

await test('concurrent tap reaches the configured concurrency and settles', async () => {
  const release = deferred<void>()
  const saturated = deferred<void>()
  const tapped: number[] = []
  let active = 0
  let maximumActive = 0

  const result = G.pipe(
    G.ofIterable(Array.from({ length: 20 }, (_, index) => index)),
    G.tap(async value => {
      active += 1
      maximumActive = Math.max(maximumActive, active)
      if (active === 3) {
        saturated.resolve()
      }
      await release.promise
      tapped.push(value)
      active -= 1
    }, { concurrency: 3 }),
    G.array
  )

  await saturated.promise
  assert.equal(active, 3)
  assert.equal(maximumActive, 3)

  release.resolve()
  assert.deepEqual(await result, Array.from({ length: 20 }, (_, index) => index))
  assert.deepEqual(tapped.toSorted((left, right) => left - right), Array.from({ length: 20 }, (_, index) => index))
  assert.equal(active, 0)
})
