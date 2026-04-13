import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('pipe0', () => {
  const f = G.pipe0(
    G.map((_: number) => _ * 2),
    G.map(_ => String(_))
  )
  assert.deepEqual(G.array(f([ 3, 4, 5 ])), [ '6', '8', '10' ])
})
