import * as Semver from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const precedence = [
  '1.0.0-alpha',
  '1.0.0-alpha.1',
  '1.0.0-alpha.beta',
  '1.0.0-beta',
  '1.0.0-beta.2',
  '1.0.0-beta.11',
  '1.0.0-rc.1',
  '1.0.0'
]

const sign = (value: number) => Math.sign(value)

await test('matches the SemVer 2.0 precedence example', () => {
  assert.deepEqual(precedence.toReversed().sort(Semver.stringCmp), precedence)
})

await test('compares prerelease identifiers by SemVer rules', () => {
  assert.equal(Semver.stringCmp('1.0.0-alpha.2', '1.0.0-alpha.10'), -1)
  assert.equal(Semver.stringCmp('1.0.0-1', '1.0.0-alpha'), -1)
  assert.equal(Semver.stringCmp('1.0.0-alpha', '1.0.0-alpha.1'), -1)
  assert.equal(Semver.stringCmp('1.0.0-alpha.1', '1.0.0-alpha.beta'), -1)
  assert.equal(Semver.stringCmp('1.0.0', '1.0.0-alpha'), 1)
})

await test('ignores build metadata and parse dates for precedence', () => {
  assert.equal(Semver.stringCmp('1.0.0+build.1', '1.0.0+build.2'), 0)
  assert.equal(Semver.stringCmp('1.0.0-alpha+one', '1.0.0-alpha+two'), 0)
  assert.equal(Semver.cmp(
    Semver.parse('1.0.0+one', '2026-01-01'),
    Semver.parse('1.0.0+two', '2025-01-01')
  ), 0)
})

await test('parsed and string comparators obey comparator laws', () => {
  const prereleases = [
    undefined,
    '0',
    '1',
    'alpha',
    'alpha.1',
    'alpha.beta',
    'beta.2',
    'beta.11'
  ]
  const versions = Array.from({ length: 32 }, (_, index) => {
    const core = `${index % 4}.${Math.floor(index / 4) % 2}.${Math.floor(index / 8) % 2}`
    const prerelease = prereleases[index % prereleases.length]
    const build = index % 3 === 0 ? `+build.${index}` : ''
    return `${core}${prerelease === undefined ? '' : `-${prerelease}`}${build}`
  })

  for (const left of versions) {
    for (const right of versions) {
      const stringResult = Semver.stringCmp(left, right)
      const parsedResult = Semver.cmp(Semver.parse(left), Semver.parse(right))

      assert.equal(sign(stringResult), sign(parsedResult))
      assert.equal(sign(stringResult), -sign(Semver.stringCmp(right, left)))
    }
  }

  for (const left of versions) {
    for (const middle of versions) {
      if (Semver.stringCmp(left, middle) > 0) {
        continue
      }
      for (const right of versions) {
        if (Semver.stringCmp(middle, right) <= 0) {
          assert.ok(Semver.stringCmp(left, right) <= 0)
        }
      }
    }
  }
})
