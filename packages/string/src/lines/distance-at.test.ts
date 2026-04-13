import distanceAt from './distance-at.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('distanceAt', () => {
  assert.deepEqual(distanceAt(['hello', 'world'], 0, ['world']), 4)
  assert.deepEqual(distanceAt(['hello', 'world'], 1, ['world']), 0)
})
