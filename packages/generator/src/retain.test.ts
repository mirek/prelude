import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('retain', () => {
  const g = G.range(1, 100)
  assert.deepEqual(G.pipe(g, G.retain, G.take(3), G.array), [ 1, 2, 3 ])
  assert.deepEqual(G.pipe(g, G.retain, G.take(3), G.array), [ 4, 5, 6 ])
  assert.deepEqual(G.pipe(g, G.take(3), G.array), [ 7, 8, 9 ])
  assert.deepEqual(G.pipe(g, G.take(3), G.array), [])
})

await test('for', () => {
  const g = G.retain(G.range(1, 5), 2)
  for (const _ of g) {
    break
  }
  for (const _ of g) {
    break
  }
  const values: number[] = []
  for (const value of g) {
    values.push(value)
  }
  assert.deepEqual(values, [ 3, 4, 5 ])
})

await test('forwards return to the wrapped generator once the retain count is spent', () => {
  const closed: string[] = []
  const source = function* () {
    try {
      yield 1
      yield 2
      yield 3
    } finally {
      closed.push('closed')
    }
  }
  const g = G.retain(source(), 1)
  assert.deepEqual(g.next(), { done: false, value: 1 })
  assert.deepEqual(g.return(undefined), { done: true, value: undefined })
  assert.deepEqual(closed, [])
  assert.deepEqual(g.next(), { done: false, value: 2 })
  assert.deepEqual(g.return(undefined), { done: true, value: undefined })
  assert.deepEqual(closed, [ 'closed' ])
  assert.deepEqual(g.next(), { done: true, value: undefined })
})

await test('forwards throw to the wrapped generator', () => {
  const caught: unknown[] = []
  const source = function* () {
    try {
      yield 1
      yield 2
    } catch (err) {
      caught.push(err)
      yield 'recovered'
    }
  }
  const g = G.retain(source(), 0)
  assert.deepEqual(g.next(), { done: false, value: 1 })
  assert.deepEqual(g.throw(new Error('boom')), { done: false, value: 'recovered' })
  assert.equal((caught[0] as Error).message, 'boom')
})
