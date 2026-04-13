import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('groupMap', () => {
  const values = [
    { key: 1, value: 'a' },
    { key: '1', value: 'b' },
    { key: 1, value: 'c' }
  ]
  const grouped = G.pipe(values, G.groupMap(_ => _.key))
  assert.equal(grouped instanceof Map, true)
  assert.equal(grouped.size, 2)
  assert.deepEqual(Array.from(grouped.entries()), [
    [ 1, [
      { key: 1, value: 'a' },
      { key: 1, value: 'c' }
    ] ],
    [ '1', [
      { key: '1', value: 'b' }
    ] ]
  ])
})
