import * as Cmp from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('epsilon', () => {
  assert.equal(0.1 + 0.2 === 0.3, false)
  assert.equal(Cmp.epsilon(0.1 + 0.2, 0.3), true)
})
