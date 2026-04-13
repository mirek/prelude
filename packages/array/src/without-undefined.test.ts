import * as A from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('withoutUndefined', () => {
  assert.deepEqual(A.withoutUndefined([ 1, null, 3, undefined, 5 ]), [ 1, null, 3, 5 ])
})
