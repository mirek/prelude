import * as Jsonrpc from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('kind', () => {
  assert.equal(Jsonrpc.kind(undefined), undefined)
  assert.equal(Jsonrpc.kind({ jsonrpc: '2.0', id: 1, method: 'a', params: [] }), 'call')
  assert.equal(Jsonrpc.kind({ jsonrpc: '2.0', method: 'a', params: [] }), 'notification')
  assert.equal(Jsonrpc.kind({ jsonrpc: '2.0', id: 1, result: null }), 'result')
  assert.equal(Jsonrpc.kind({ jsonrpc: '2.0', id: 1, error: { message: 'a' } }), 'error')
})
