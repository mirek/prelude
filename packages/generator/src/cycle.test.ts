import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('cycle', () => {
  assert.deepEqual(G.array(G.pipe(G.cycle([ 1, 2, 3 ]), G.take(7))), [
    1, 2, 3,
    1, 2, 3,
    1
  ])
})

await test('empty', () => {
  assert.deepEqual(G.array(G.cycle([])), [])
})
