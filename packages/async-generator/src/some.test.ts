import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('some', async () => {
  assert.equal(await G.pipe(
    G.range(1, 5),
    G.some(_ => _ > 3)
  ), true)
  assert.equal(await G.pipe(
    G.range(1, 5),
    G.some(_ => _ > 5)
  ), false)
})
