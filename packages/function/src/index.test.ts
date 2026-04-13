import * as Function from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('Function.t works with instanceof', () => {
  const f = () => 1
  assert.equal(f instanceof Function.t, true)
})

await test('Function.t is a function', () => {
  assert.equal(typeof Function.t, 'function')
})

await test('Function.t can be used as type in Map', () => {
  const map = new Map<string, Function.t>()
  map.set('f', (_: number) => _ + 1)
  assert.deepEqual(map.get('f')?.(1), 2)
})
