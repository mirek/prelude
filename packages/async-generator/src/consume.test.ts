import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const reiterable = {
  async *[Symbol.asyncIterator]() {
    yield 1
    yield 2
    yield 3
  }
}

await test('concurrent consume processes each value of a re-iterable source once', async () => {
  const seen: number[] = []
  await G.consume((value: number) => {
    seen.push(value)
  }, { concurrency: 2 })(reiterable)
  assert.deepEqual(seen.toSorted((a, b) => a - b), [ 1, 2, 3 ])
})

await test('serial consume and generator sources are unchanged', async () => {
  const seen: number[] = []
  await G.consume((value: number) => {
    seen.push(value)
  })(reiterable)
  assert.deepEqual(seen, [ 1, 2, 3 ])
  const indices: number[] = []
  await G.consume((_: number, index: number) => {
    indices.push(index)
  }, { concurrency: 3 })(G.ofIterable([ 10, 20, 30, 40 ]))
  assert.deepEqual(indices.toSorted((a, b) => a - b), [ 0, 1, 2, 3 ])
})
