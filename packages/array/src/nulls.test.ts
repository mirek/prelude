import * as A from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('nulls', () => {
  assert.deepEqual(A.nulls(3), [ null, null, null ])
})
