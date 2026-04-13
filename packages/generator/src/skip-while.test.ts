import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('skip while', () => {
  let n = 0
  assert.deepEqual(G.pipe(
    G.from(1),
    G.skipWhile(value => {
      n++
      return value < 10
    }),
    G.take(3),
    G.array
  ), [
    10,
    11,
    12
  ])
  assert.equal(n, 10)
})
