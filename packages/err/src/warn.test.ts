import * as Err from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('warn', () => {
  const e = Err.warn('foo', 'bar')
  assert.equal(e.message, 'bar')
  assert.equal(e.severity, 'warn')
  assert.equal(e.code, 'foo')
})
