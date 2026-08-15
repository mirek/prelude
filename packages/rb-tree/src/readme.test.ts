import * as RbTree from './index.js'
import * as Cmp from '@prelude/cmp'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('the Readme usage example runs as written', () => {
  const rb = RbTree.of(Cmp.string, (_: string) => _)
  RbTree.insert(rb, 'foo')
  RbTree.insert(rb, 'bar')
  assert.equal(RbTree.has(rb, 'foo'), true)
  assert.equal(RbTree.has(rb, 'baz'), false)
  assert.deepEqual([ ...RbTree.each(rb) ], [ 'bar', 'foo' ])
})
