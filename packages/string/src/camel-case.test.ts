import camelCase from './camel-case.js'
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

await describe('camelCase', async () => {
  await test('converts kebab-case to camelCase', () => {
    assert.equal(camelCase('kebab-case'), 'kebabCase')
  })

  await test('converts PascalCase to camelCase', () => {
    assert.equal(camelCase('PascalCase'), 'pascalCase')
  })

  await test('converts snake_case to camelCase', () => {
    assert.equal(camelCase('snake_case'), 'snakeCase')
  })

  await test('converts space separated to camelCase', () => {
    assert.equal(camelCase('space separated'), 'spaceSeparated')
  })

  await test('handles strings with multiple separators', () => {
    assert.equal(camelCase('mixed_Case With-separators'), 'mixedCaseWithSeparators')
  })
})
