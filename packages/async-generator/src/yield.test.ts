import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('yield', async () => {

  assert.deepEqual(await G.pipe(
    G.ofIterable([ 3, 5, 7 ]),
    G.reduce((r, _) => r + _, 0),
    G.yield,
    G.cycle(2),
    G.array
  ), [
    15,
    15
  ])
})
