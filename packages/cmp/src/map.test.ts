import * as Cmp from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('map', () => {
  assert.deepEqual([
    { rank: 3, name: 'a' },
    { rank: 1, name: 'b' },
    { rank: 2, name: 'c' }
  ].sort(Cmp.map(Cmp.number, _ => _.rank)), [
    { rank: 1, name: 'b' },
    { rank: 2, name: 'c' },
    { rank: 3, name: 'a' }
  ])
})
