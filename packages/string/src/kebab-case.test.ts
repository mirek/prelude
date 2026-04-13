import kebabCase from './kebab-case.js'
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

await describe('kebabCase', async () => {
  await test('converts camelCase to kebab-case', () => {
    assert.equal(kebabCase('camelCase'), 'camel-case')
  })

  await test('converts PascalCase to kebab-case', () => {
    assert.equal(kebabCase('PascalCase'), 'pascal-case')
  })

  await test('converts snake_case to kebab-case', () => {
    assert.equal(kebabCase('snake_case'), 'snake-case')
  })

  await test('converts space separated to kebab-case', () => {
    assert.equal(kebabCase('space separated'), 'space-separated')
  })

  await test('handles strings with multiple separators', () => {
    assert.equal(kebabCase('mixed_Case With-separators'), 'mixed-case-with-separators')
  })
})
