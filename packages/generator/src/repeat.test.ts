import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('repeat', () => {
  assert.deepEqual(G.array(G.pipe(
    G.repeat(3, Math.random),
    G.map(_ => typeof _)
  )), [
    'number', 'number', 'number'
  ])
})

await test('distinct', () => {
  const _s = G.array(G.repeat(2, () => ({})))
  assert.equal((_s).length, 2)
  assert.notEqual(_s[0], _s[1])
})
