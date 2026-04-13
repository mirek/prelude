import * as S from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('blank', () => {
  assert.equal(S.isBlank(''), true)
  assert.equal(S.isBlank(' \t\n'), true)
  assert.equal(S.isBlank(' a'), false)
})
