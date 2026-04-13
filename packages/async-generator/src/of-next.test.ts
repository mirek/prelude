import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('ofNext', async () => {
  assert.deepEqual(await G.pipe(
    G.ofNext(async i => ({ done: false, value: i ** 2 })),
    G.take(5),
    G.array
  ), [ 0, 1, 4, 9, 16 ])
})
