import * as A from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('map', async () => {
  assert.deepEqual(await Promise
      .resolve([ 1, 2, 3, 4, 5 ])
      .then(A.mapOf(_ => _ * 2)), [ 2, 4, 6, 8, 10 ])
})
