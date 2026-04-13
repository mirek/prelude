import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('window', async () => {
  assert.deepEqual(await G.pipe(
    G.range(1, 5),
    G.window(2),
    G.array
  ), [
    [ 1, 2 ],
    [ 2, 3 ],
    [ 3, 4 ],
    [ 4, 5 ]
  ])
})
