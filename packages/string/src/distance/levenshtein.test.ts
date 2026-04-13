import levenshtein from './levenshtein.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('simple', () => {
  assert.equal(levenshtein('kitten', 'sitting'), 3)
  assert.equal(levenshtein('sunday', 'saturday'), 3)
  assert.equal(levenshtein('cat', 'cut'), 1)
  assert.equal(levenshtein('', 'test'), 4)
  assert.equal(levenshtein('book', 'book'), 0)
})
