import * as A from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('filter', async () => {
  assert.deepEqual(await Promise
      .resolve([ 1, 2, 3, 4, 5 ])
      .then(A.filterOf(_ => _ % 2 === 0)), [ 2, 4 ])
})
