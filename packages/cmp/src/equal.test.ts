import * as Cmp from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('locale strings', () => {
  const eq = Cmp.equal(Cmp.locale(undefined, {
    ignorePunctuation: true,
    sensitivity: 'base'
  }))
  assert.equal(eq(
    'Używanie porównywania... jest,  fajne!',
    'uzywanie porownywania jest fajne'
  ), true)
  assert.equal(eq(
    'Używanie porównywania... jest,  fajne!',
    'uzywanie porownywania jest bardzo fajne'
  ), false)
})
