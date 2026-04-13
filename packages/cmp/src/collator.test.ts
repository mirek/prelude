import * as Cmp from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('french locale, search usage, base sensitivity', () => {
  const cmp = Cmp.collator(new Intl.Collator('fr', {
    usage: 'search',
    sensitivity: 'base'
  }))
  assert.equal(cmp('Congrès', 'congres'), Cmp.eq)
  assert.equal(cmp('Assemblée', 'poisson'), Cmp.asc)
})
