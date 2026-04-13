import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('groupMap', () => {
  const values = [
    { key: 1, value: 'a' },
    { key: '1', value: 'b' },
    { key: 1, value: 'c' }
  ]
  assert.deepEqual(G.pipe(values, G.group(_ => _.key), G.array), [
    [ 1, [
      { key: 1, value: 'a' },
      { key: 1, value: 'c' }
    ] ],
    [ '1', [
      { key: '1', value: 'b' }
    ] ]
  ])
})
