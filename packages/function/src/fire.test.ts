import * as F from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('fire routes synchronous throws to the rejection handler', async () => {
  const seen: unknown[] = []
  assert.doesNotThrow(() => F.fire(() => { throw new Error('sync') }, err => seen.push(err)))
  F.fire(() => Promise.reject(new Error('async')), err => seen.push(err))
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.deepEqual(seen.map(err => (err as Error).message), [ 'sync', 'async' ])
})
