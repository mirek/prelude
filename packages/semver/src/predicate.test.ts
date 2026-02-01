import * as Semver from './index.js'

test('predicate', () => {
  expect(Semver.predicate('1.0.0')).toBe(true)
  expect(Semver.predicate('1.0.0-alpha')).toBe(true)
  expect(Semver.predicate('1.0.0-alpha.1')).toBe(true)
  expect(Semver.predicate('1.0.foo')).toBe(false)
})
