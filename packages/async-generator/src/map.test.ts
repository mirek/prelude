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

await test('map', async () => {
  const result = await G.pipe(
    G.ofIterable([ 1, 2, 3 ]),
    G.map(x => String(x * 2)),
    G.array
  )
  for (const value of [ '2', '4', '6' ]) {
    assert.ok(result.includes(value))
  }
})

await test('concurrent map reaches the configured concurrency and preserves order', async () => {
  const release = deferred<void>()
  const saturated = deferred<void>()
  let active = 0
  let maximumActive = 0

  const result = G.pipe(
    G.range(1, 9),
    G.map(async value => {
      active += 1
      maximumActive = Math.max(maximumActive, active)
      if (active === 3) {
        saturated.resolve()
      }
      await release.promise
      active -= 1
      return String(value * 2)
    }, { concurrency: 3 }),
    G.array
  )

  await saturated.promise
  assert.equal(active, 3)
  assert.equal(maximumActive, 3)

  release.resolve()
  assert.deepEqual(await result, [ '2', '4', '6', '8', '10', '12', '14', '16', '18' ])
  assert.equal(active, 0)
})
