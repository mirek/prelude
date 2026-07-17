import * as Semver from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('sorts stable releases ahead of prereleases in descending order', () => {
  assert.deepEqual([
    '1.0.0-alpha.beta',
    '1.0.0',
    'v2.0.1',
    '1.0.0-alpha',
    '1.1.0',
    '1.0.0-beta',
    '1.0.0-alpha.1',
    'v2.0.0'
  ].sort(Semver.stringDsc), [
    'v2.0.1',
    'v2.0.0',
    '1.1.0',
    '1.0.0',
    '1.0.0-beta',
    '1.0.0-alpha.beta',
    '1.0.0-alpha.1',
    '1.0.0-alpha'
  ])
})

await test('is the exact reverse of ascending precedence', () => {
  const versions = [
    '1.0.0-alpha',
    '1.0.0-alpha.1',
    '1.0.0-alpha.beta',
    '1.0.0-beta',
    '1.0.0-beta.2',
    '1.0.0-beta.11',
    '1.0.0-rc.1',
    '1.0.0'
  ]

  assert.deepEqual(versions.toSorted(Semver.stringDsc), versions.toReversed())
})
