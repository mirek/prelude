import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('step', () => {
  assert.deepEqual(G.array(G.pipe(G.charRange('a', 'z'), G.step(2))), [
    'a',
    'c',
    'e',
    'g',
    'i',
    'k',
    'm',
    'o',
    'q',
    's',
    'u',
    'w',
    'y'
  ])
})
