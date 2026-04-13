import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('42', () => {
  assert.deepEqual(P.pipe(42, String), '42')
})
