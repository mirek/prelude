import * as Semver from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('maybeParse', () => {
  assert.deepEqual(Semver.maybeParse('1.0.0'), {
    major: 1,
    minor: 0,
    patch: 0,
    prerelease: undefined,
    build: undefined,
    date: undefined
  })
  assert.deepEqual(Semver.maybeParse('1.0.0-alpha'), {
    major: 1,
    minor: 0,
    patch: 0,
    prerelease: 'alpha',
    build: undefined,
    date: undefined
  })
  assert.deepEqual(Semver.maybeParse('1.0.0-alpha.1'), {
    major: 1,
    minor: 0,
    patch: 0,
    prerelease: 'alpha.1',
    build: undefined,
    date: undefined
  })
  assert.equal(Semver.maybeParse('1.0.foo'), undefined)
  assert.deepEqual(Semver.maybeParse('1.0.0', '2020-01-01'), {
    major: 1,
    minor: 0,
    patch: 0,
    prerelease: undefined,
    build: undefined,
    date: '2020-01-01'
  })
})
