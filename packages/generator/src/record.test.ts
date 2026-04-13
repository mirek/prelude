import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('on conflict throws', () => {
  assert.throws(() => G.pipe(
    [ 1, 2, 2, 3 ],
    G.record(String)
  ), /duplicate key 2/)
})

await test('on conflict first wins', () => {
  assert.deepEqual(G.pipe(
    [ 1, 21, 22, 3 ],
    G.record(_ => String(_)[0], G.record.firstWins)
  ), {
    '1': 1,
    '2': 21,
    '3': 3
  })
})

await test('on conflict last wins', () => {
  assert.deepEqual(G.pipe(
    [ 1, 21, 22, 3 ],
    G.record(_ => String(_)[0], G.record.lastWins)
  ), {
    '1': 1,
    '2': 22,
    '3': 3
  })
})
