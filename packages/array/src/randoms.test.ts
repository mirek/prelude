import * as A from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('randoms', () => {
  assert.equal((A.randoms(3)).length, 3)
})
