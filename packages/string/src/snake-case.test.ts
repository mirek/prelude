import snakeCase from './snake-case.js'
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

await describe('snakeCase', async () => {
  await test('converts camelCase to snake_case', () => {
    assert.equal(snakeCase('camelCase'), 'camel_case')
  })

  await test('converts PascalCase to snake_case', () => {
    assert.equal(snakeCase('PascalCase'), 'pascal_case')
  })

  await test('converts kebab-case to snake_case', () => {
    assert.equal(snakeCase('kebab-case'), 'kebab_case')
  })

  await test('converts space separated to snake_case', () => {
    assert.equal(snakeCase('space separated'), 'space_separated')
  })

  await test('handles strings with multiple separators', () => {
    assert.equal(snakeCase('mixed_Case With-separators'), 'mixed_case_with_separators')
  })
})
