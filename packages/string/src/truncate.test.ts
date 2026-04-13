import truncate from './truncate.js'
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

await describe('truncate', async () => {
  await test('returns the original string if shorter than length', () => {
    assert.equal(truncate('hello', 10), 'hello')
  })

  await test('returns the original string if equal to length', () => {
    assert.equal(truncate('hello', 5), 'hello')
  })

  await test('truncates the string and adds suffix if longer than length', () => {
    assert.equal(truncate('hello world', 8), 'hello...')
  })

  await test('uses custom suffix when provided', () => {
    assert.equal(truncate('hello world', 7, '.'), 'hello.')
  })

  await test('handles empty string', () => {
    assert.equal(truncate('', 5), '')
  })

  await test('handles zero length', () => {
    assert.equal(truncate('hello', 0), '...')
  })

  await test('handles negative length', () => {
    assert.equal(truncate('hello', -5), '...')
  })

  await test('handles length less than suffix length', () => {
    assert.equal(truncate('hello', 2, '...'), '...')
  })
})