import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('single', () => {
  // expect(() => G.single([])).toThrow('Expected single element, got none.')
  assert.deepEqual(G.single([42]), 42)
  // expect(() => G.single([ 1, 2 ])).toThrow('Expected single element, got more.')
})
