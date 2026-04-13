import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('recursive', () => {
  assert.deepEqual(G.pipe(
    G.recursive(_ => _ + 1, 1, _ => _ === 10),
    G.array
  ), [
    1, 2, 3, 4, 5, 6, 7, 8, 9
  ])
})
