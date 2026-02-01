import * as Semver from './index.js'

test('parse', () => {
  expect(Semver.parse('1.0.0')).toEqual({
    major: 1,
    minor: 0,
    patch: 0,
    prerelease: undefined,
    build: undefined,
    date: undefined
  })
  expect(Semver.parse('1.0.0-alpha')).toEqual({
    major: 1,
    minor: 0,
    patch: 0,
    prerelease: 'alpha',
    build: undefined,
    date: undefined
  })
  expect(Semver.parse('1.0.0-alpha.1')).toEqual({
    major: 1,
    minor: 0,
    patch: 0,
    prerelease: 'alpha.1',
    build: undefined,
    date: undefined
  })
  expect(() => Semver.parse('1.0.foo')).toThrow('invalid semver 1.0.foo')
})
