import * as S from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('case conversions ignore surrounding whitespace', () => {
  assert.equal(S.kebabCase(' Foo Bar '), 'foo-bar')
  assert.equal(S.snakeCase(' Foo Bar '), 'foo_bar')
  assert.equal(S.camelCase(' Foo Bar '), 'fooBar')
  assert.equal(S.startCase(' foo bar '), 'Foo Bar')
  assert.equal(S.kebabCase('fooBar'), 'foo-bar')
})
