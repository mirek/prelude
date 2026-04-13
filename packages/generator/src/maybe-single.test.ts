import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('maybeSingle', () => {
  assert.equal(G.maybeSingle([]), undefined)
  assert.deepEqual(G.maybeSingle([42]), 42)
  // expect(() => G.maybeSingle([ 1, 2 ])).toThrow('Expected no elements or a single element, got more.')
})
