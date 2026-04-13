import * as Semver from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('cmp', () => {
  assert.equal(Semver.stringCmp('1.0.0', '1.0.0'), 0)
  assert.equal(Semver.stringCmp('1.0.0', '1.0.1'), -1)
  assert.equal(Semver.stringCmp('1.0.1', '1.0.0'), 1)
})
