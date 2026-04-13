import * as Semver from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('predicate', () => {
  assert.equal(Semver.predicate('1.0.0'), true)
  assert.equal(Semver.predicate('1.0.0-alpha'), true)
  assert.equal(Semver.predicate('1.0.0-alpha.1'), true)
  assert.equal(Semver.predicate('1.0.foo'), false)
})
