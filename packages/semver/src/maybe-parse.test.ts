import * as Semver from './index.js'

test('maybeParse', () => {
  expect(Semver.maybeParse('1.0.0')).toEqual({
    major: 1,
    minor: 0,
    patch: 0,
    prerelease: undefined,
    build: undefined,
    date: undefined
  })
  expect(Semver.maybeParse('1.0.0-alpha')).toEqual({
    major: 1,
    minor: 0,
    patch: 0,
    prerelease: 'alpha',
    build: undefined,
    date: undefined
  })
  expect(Semver.maybeParse('1.0.0-alpha.1')).toEqual({
    major: 1,
    minor: 0,
    patch: 0,
    prerelease: 'alpha.1',
    build: undefined,
    date: undefined
  })
  expect(Semver.maybeParse('1.0.foo')).toBe(undefined)
  expect(Semver.maybeParse('1.0.0', '2020-01-01')).toEqual({
    major: 1,
    minor: 0,
    patch: 0,
    prerelease: undefined,
    build: undefined,
    date: '2020-01-01'
  })
})
