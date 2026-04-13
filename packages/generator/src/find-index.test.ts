import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('simple', () => {
  assert.deepEqual(G.pipe(
    G.range(1, 5),
    G.findIndex(_ => _ === 3)
  ), 2)
  assert.deepEqual(G.pipe(
    G.range(1, 5),
    G.findIndex(_ => _ === 6)
  ), -1)
})
