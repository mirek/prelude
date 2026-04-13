import * as A from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('clone', () => {
  const values = [ 1, 2, 3 ]
  const cloned = A.clone(values)
  assert.deepEqual(cloned, values)
  cloned[0] = 0
  assert.notDeepEqual(cloned, values)
})
