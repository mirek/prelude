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

await test('empty input yields no window even when shorter windows are allowed', async () => {
  assert.deepEqual(await G.pipe(G.ofIterable([]), G.window(3, true), G.array), [])
  assert.deepEqual(await G.pipe(G.ofIterable([]), G.window(3), G.array), [])
  assert.deepEqual(await G.pipe(G.ofIterable([ 1 ]), G.window(3, true), G.array), [ [ 1 ] ])
})
