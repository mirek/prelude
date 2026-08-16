import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const unhandled: unknown[] = []
const onUnhandled = (reason: unknown) => {
  unhandled.push(reason)
}
process.on('unhandledRejection', onUnhandled)

const settle = () => new Promise(resolve => setTimeout(resolve, 0))

const failing = async function* () {
  yield 1
  yield 2
  throw new Error('source boom')
}

await test('concurrent map rejects when the mapping function throws', async () => {
  for (const preserveOrder of [ true, false ]) {
    await assert.rejects(G.pipe(
      G.ofIterable([ 1, 2, 3, 4 ]),
      G.map(async x => {
        if (x === 2) {
          throw new Error('map boom')
        }
        return x
      }, { concurrency: 2, preserveOrder }),
      G.array
    ), /map boom/)
  }
  await settle()
  assert.deepEqual(unhandled, [])
})

await test('concurrent map rejects when the source throws', async () => {
  for (const preserveOrder of [ true, false ]) {
    await assert.rejects(G.pipe(
      failing(),
      G.map(async x => x, { concurrency: 2, preserveOrder }),
      G.array
    ), /source boom/)
  }
  await settle()
  assert.deepEqual(unhandled, [])
})

await test('concurrent tap rejects when the tapped function or the source throws', async () => {
  await assert.rejects(G.pipe(
    G.ofIterable([ 1, 2, 3, 4 ]),
    G.tap(async x => {
      if (x === 3) {
        throw new Error('tap boom')
      }
    }, { concurrency: 2 }),
    G.array
  ), /tap boom/)
  await assert.rejects(G.pipe(
    failing(),
    G.tap(async () => {}, { concurrency: 2 }),
    G.array
  ), /source boom/)
  await settle()
  assert.deepEqual(unhandled, [])
})

await test('a failing worker stops the remaining workers', async () => {
  const seen: number[] = []
  await assert.rejects(G.pipe(
    G.ofIterable([ 1, 2, 3, 4, 5, 6, 7, 8 ]),
    G.map(async x => {
      seen.push(x)
      if (x === 1) {
        throw new Error('first boom')
      }
      await settle()
      return x
    }, { concurrency: 2 }),
    G.array
  ), /first boom/)
  await settle()
  await settle()
  assert.ok(seen.length < 8, `expected remaining values to be skipped, saw ${seen.length}`)
  assert.deepEqual(unhandled, [])
})

await test('ordered map rejects instead of hanging when the source and a worker both fail', async () => {
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
  const failingSlowly = async function* () {
    yield 0
    yield 1
    yield 2
    await sleep(10)
    throw new Error('source boom')
  }
  const timeout = sleep(500).then(() => {
    throw new Error('timed out: ordered map never settled')
  })
  await assert.rejects(Promise.race([
    G.pipe(
      failingSlowly(),
      G.map(async x => {
        if (x === 0) {
          await sleep(30)
          throw new Error('map boom')
        }
        return x
      }, { concurrency: 3, preserveOrder: true }),
      G.array
    ),
    timeout
  ]), /source boom|map boom/)
  await settle()
  assert.deepEqual(unhandled, [])
})

await test('successful concurrent map and tap are unaffected', async () => {
  assert.deepEqual(await G.pipe(
    G.ofIterable([ 1, 2, 3 ]),
    G.map(async x => x * 2, { concurrency: 2 }),
    G.array
  ), [ 2, 4, 6 ])
  const tapped: number[] = []
  assert.deepEqual(await G.pipe(
    G.ofIterable([ 1, 2, 3 ]),
    G.tap(async x => {
      tapped.push(x)
    }, { concurrency: 2 }),
    G.array
  ), [ 1, 2, 3 ])
  assert.deepEqual(tapped.toSorted((a, b) => a - b), [ 1, 2, 3 ])
})

process.off('unhandledRejection', onUnhandled)

await test('a failing source still delivers the results already in flight', async () => {
  const failingSlowly = async function* () {
    yield 0
    yield 1
    yield 2
    throw new Error('source boom')
  }
  for (const preserveOrder of [ true, false ]) {
    const got: number[] = []
    await assert.rejects((async () => {
      for await (const value of G.map(async (v: number) => {
        await new Promise(resolve => setTimeout(resolve, 5))
        return v
      }, { concurrency: 3, preserveOrder })(failingSlowly())) {
        got.push(value)
      }
    })(), /source boom/)
    assert.deepEqual(got.toSorted((a, b) => a - b), [ 0, 1, 2 ], `preserveOrder ${preserveOrder}`)
  }
  await settle()
  assert.deepEqual(unhandled, [])
})
