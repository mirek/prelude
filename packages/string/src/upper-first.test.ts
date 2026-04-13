import * as S from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('upperFirst', () => {
  assert.deepEqual(S.upperFirst(''), '')
  assert.deepEqual(S.upperFirst('abc def'), 'Abc def')
  assert.deepEqual(S.upperFirst('Abc def'), 'Abc def')
  assert.deepEqual(S.upperFirst('åbc def'), 'Åbc def')
})
