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

await test('a failing callback stops the remaining workers and closes the source', async () => {
  const seen: number[] = []
  let closed = false
  const source = async function* () {
    try {
      for (let i = 0; i < 50; i++) {
        yield i
      }
    } finally {
      closed = true
    }
  }
  await assert.rejects(G.consume(async (value: number) => {
    seen.push(value)
    if (value === 2) {
      throw new Error('boom')
    }
    await new Promise(resolve => setTimeout(resolve, 1))
  }, { concurrency: 3 })(source()), /boom/)
  await new Promise(resolve => setTimeout(resolve, 20))
  assert.ok(seen.length < 50, `remaining values were not consumed, saw ${seen.length}`)
  assert.equal(closed, true)

  // A plain async iterator without return(): workers still stop pulling.
  let pulled = 0
  const plain: AsyncIterable<number> = {
    [Symbol.asyncIterator]: () => ({
      next: async () => pulled < 50 ? { done: false, value: pulled++ } : { done: true, value: undefined }
    })
  }
  await assert.rejects(G.consume(async (value: number) => {
    if (value === 2) {
      throw new Error('boom')
    }
    await new Promise(resolve => setTimeout(resolve, 1))
  }, { concurrency: 3 })(plain), /boom/)
  await new Promise(resolve => setTimeout(resolve, 300))
  assert.ok(pulled < 10, `plain iterator pulled ${pulled}`)
})
