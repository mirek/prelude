import * as S from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('ifBlank', () => {
  assert.equal(S.ifBlank('', () => false), false)
  assert.equal(S.ifBlank('a', () => false), 'a')
})
