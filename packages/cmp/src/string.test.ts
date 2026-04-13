import * as Cmp from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('sort', () => {
  assert.deepEqual([ 'world', 'hello' ].sort(Cmp.string), [
    'hello',
    'world'
  ])
})
