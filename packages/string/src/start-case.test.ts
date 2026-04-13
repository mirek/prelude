import startCase from './start-case.js'
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

await describe('startCase', async () => {
  await test('converts camelCase to Start Case', () => {
    assert.equal(startCase('camelCase'), 'Camel Case')
  })

  await test('converts PascalCase to Start Case', () => {
    assert.equal(startCase('PascalCase'), 'Pascal Case')
  })

  await test('converts kebab-case to Start Case', () => {
    assert.equal(startCase('kebab-case'), 'Kebab Case')
  })

  await test('converts snake_case to Start Case', () => {
    assert.equal(startCase('snake_case'), 'Snake Case')
  })

  await test('converts space separated to Start Case', () => {
    assert.equal(startCase('space separated'), 'Space Separated')
  })

  await test('handles strings with multiple separators', () => {
    assert.equal(startCase('mixed_Case With-separators'), 'Mixed Case With Separators')
  })
})
