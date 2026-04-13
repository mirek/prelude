import * as Cmp from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('chain', () => {
  assert.deepEqual([
    { rank: 3, name: 'a' },
    { rank: 1, name: 'b' },
    { rank: 3, name: 'b' },
    { rank: 2, name: 'c' },
    { rank: 1, name: 'a' }
  ].sort(Cmp.chain(
    Cmp.map(Cmp.number, _ => _.rank),
    Cmp.map(Cmp.string, _ => _.name)
  )), [
    { rank: 1, name: 'a' },
    { rank: 1, name: 'b' },
    { rank: 2, name: 'c' },
    { rank: 3, name: 'a' },
    { rank: 3, name: 'b' }
  ])
})
