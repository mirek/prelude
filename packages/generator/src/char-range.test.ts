import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('charRange', () => {
  assert.deepEqual(G.array(G.charRange('a', 'd')), [
    'a', 'b', 'c', 'd'
  ])
})

await test('astral ranges yield whole characters', () => {
  assert.deepEqual([ ...G.charRange('😀', '😂') ], [ '😀', '😁', '😂' ])
})
